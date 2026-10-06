import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.postgres_models import UserOTP

logger = logging.getLogger(__name__)

def get_utc_now() -> datetime:
    """Returns current naive UTC datetime without Python 3.12+ deprecation warnings."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class OTPService:
    @staticmethod
    def generate_code() -> str:
        """Generates a cryptographically random 6-digit numeric OTP string."""
        return f"{secrets.randbelow(900000) + 100000:06d}"

    @classmethod
    def dispatch_notification(cls, email: str, code: str, expires_minutes: int) -> None:
        """
        Dispatches OTP notification to user.
        Always logs to console with a high-visibility terminal banner (free, local, zero-setup).
        If SMTP host is configured, attempts to send real email via standard SMTP.
        """
        expires_at_str = (get_utc_now() + timedelta(minutes=expires_minutes)).strftime("%Y-%m-%d %H:%M:%S UTC")

        
        banner = (
            f"\n"
            f"+------------------------------------------------------------------------------+\n"
            f"|          [KNOWLEDGESPHERE AI] TWO-FACTOR AUTHENTICATION (OTP) DISPATCH       |\n"
            f"+------------------------------------------------------------------------------+\n"
            f"|  Recipient:       {email:<58} |\n"
            f"|  Security Code:   >>> {code} <<<                                        |\n"
            f"|  Validity:        {expires_minutes} Minutes (Expires at {expires_at_str})             |\n"
            f"|  Delivery Mode:   Free Local Zero-Cost Dispatch                              |\n"
            f"+------------------------------------------------------------------------------+\n"
        )
        try:
            print(banner, flush=True)
        except Exception:
            pass
        logger.info("[AUTH OTP] Sent code %s to %s (valid for %d mins)", code, email, expires_minutes)


        # Dispatch native Windows desktop popup notification (free, instant, outside browser)
        try:
            import threading
            from win11toast import toast
            def _show_toast():
                try:
                    toast("KnowledgeSphere AI Security", f"Your 2FA code is: >>> {code} <<< (Valid for {expires_minutes} mins)")
                except Exception:
                    pass
            threading.Thread(target=_show_toast, daemon=True).start()
        except Exception:
            pass

        # Dispatch optional Discord Webhook if configured
        import os
        discord_url = os.getenv("DISCORD_WEBHOOK_URL", "")
        if discord_url and discord_url.startswith("http"):
            try:
                import urllib.request, json
                payload = json.dumps({"content": f"🔒 **KnowledgeSphere AI 2FA Code** for `{email}`:\n>>> **{code}** (Expires in {expires_minutes} mins)"}).encode()
                req = urllib.request.Request(discord_url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "KnowledgeSphereAI/1.0"})
                urllib.request.urlopen(req, timeout=3)
            except Exception:
                pass

        # Dispatch Telegram notification via Telegram Bot API (free, instant)
        cls._send_telegram(email, code, expires_minutes)

        # Attempt real SMTP email dispatch if configured
        if settings.SMTP_HOST and settings.SMTP_HOST.strip():
            try:
                cls._send_email(email, code, expires_minutes)
            except Exception as e:
                logger.warning("[AUTH OTP] Optional SMTP dispatch failed (%s).", str(e))

    @classmethod
    def _send_telegram(cls, email: str, code: str, expires_minutes: int) -> None:
        """
        Sends OTP verification code to Telegram via the official Telegram Bot API.
        100% free, zero external subscription cost, instant delivery to mobile/desktop.
        """
        bot_token = (settings.TELEGRAM_BOT_TOKEN or "").strip()
        chat_id = (settings.TELEGRAM_CHAT_ID or "").strip()
        if not bot_token or not chat_id:
            return

        import threading
        def _dispatch():
            try:
                import urllib.request
                import json
                api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                expires_at_str = (get_utc_now() + timedelta(minutes=expires_minutes)).strftime("%H:%M:%S UTC")
                text = (
                    "🔐 *KnowledgeSphere AI — 2FA Security Code*\n\n"
                    f"👤 *Recipient:* `{email}`\n"
                    f"🔢 *Verification Code:* `{code}`\n"
                    f"⏱ *Valid for:* {expires_minutes} minutes (Expires at {expires_at_str})\n\n"
                    "🛡 _If you did not request this login code, disregard this message._"
                )
                payload = json.dumps({
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "Markdown"
                }).encode("utf-8")
                req = urllib.request.Request(
                    api_url,
                    data=payload,
                    headers={"Content-Type": "application/json", "User-Agent": "KnowledgeSphereAI-2FA/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        logger.info("[AUTH OTP] Successfully dispatched Telegram OTP to chat %s", chat_id)
            except Exception as e:
                logger.warning("[AUTH OTP] Optional Telegram dispatch failed (%s).", str(e))

        threading.Thread(target=_dispatch, daemon=True).start()


    @classmethod
    def _send_email(cls, recipient_email: str, code: str, expires_minutes: int) -> None:
        """Sends an HTML email with the OTP using standard Python smtplib."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"KnowledgeSphere AI - Your Verification Code is {code}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = recipient_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f7f5f0; padding: 20px; color: #111;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h2 style="color: #E57D25; margin-top: 0;">KnowledgeSphere AI</h2>
                <p>Hello,</p>
                <p>You requested a one-time verification code to sign in to your KnowledgeSphere AI account.</p>
                <div style="background-color: #fdf6ec; border: 1px solid #fbd38d; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #c05621; font-family: monospace;">{code}</span>
                </div>
                <p style="font-size: 13px; color: #666;">This verification code will expire in <strong>{expires_minutes} minutes</strong>. If you did not request this login attempt, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">KnowledgeSphere AI Enterprise Security Engine</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [recipient_email], msg.as_string())

    @classmethod
    def create_and_send_otp(cls, db: Session, email: str, purpose: str = "login") -> Tuple[str, int]:
        """
        Invalidates any pending OTPs for the user, creates a fresh 6-digit OTP,
        saves to database, dispatches notification, and returns (code, ttl_seconds).
        """
        # Invalidate old unused OTPs
        db.query(UserOTP).filter(
            UserOTP.email == email,
            UserOTP.purpose == purpose,
            UserOTP.is_used == False
        ).update({"is_used": True}, synchronize_session=False)

        code = cls.generate_code()
        ttl_minutes = settings.OTP_EXPIRATION_MINUTES
        expires_at = get_utc_now() + timedelta(minutes=ttl_minutes)

        otp_record = UserOTP(
            email=email,
            otp_code=code,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False,
            attempts=0
        )
        db.add(otp_record)
        db.commit()
        db.refresh(otp_record)

        # Dispatch via console / optional SMTP
        cls.dispatch_notification(email, code, ttl_minutes)

        return code, ttl_minutes * 60

    @classmethod
    def verify_otp(cls, db: Session, email: str, entered_code: str, purpose: str = "login") -> Tuple[bool, str]:
        """
        Verifies a user-provided OTP against the database record.
        Handles expiration, attempt throttling, and marks the OTP as used upon success.
        """
        record = db.query(UserOTP).filter(
            UserOTP.email == email,
            UserOTP.purpose == purpose,
            UserOTP.is_used == False
        ).order_by(UserOTP.created_at.desc()).first()

        if not record:
            return False, "No active verification code found. Please request a new code."

        # Check expiration
        if get_utc_now() > record.expires_at:

            record.is_used = True
            db.commit()
            return False, "Verification code has expired. Please request a new code."

        # Check maximum allowed attempts
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            record.is_used = True
            db.commit()
            return False, "Too many failed attempts. Code has been invalidated. Please request a new code."

        # Check code equality
        clean_code = entered_code.strip()
        if record.otp_code != clean_code:
            record.attempts += 1
            db.commit()
            remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
            if remaining <= 0:
                record.is_used = True
                db.commit()
                return False, "Incorrect verification code. Maximum attempts exceeded."
            return False, f"Incorrect verification code. ({remaining} attempts remaining)"

        # Code is valid - mark as used
        record.is_used = True
        db.commit()
        return True, "Verification successful."

otp_service = OTPService()
