import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()

print("=" * 65)
print("  KnowledgeSphere AI - Telegram 2FA Delivery Verification  ")
print("=" * 65)

if not bot_token or not chat_id:
    print("\n[!] TELEGRAM CREDENTIALS NOT CONFIGURED YET.")
    print("\nTo enable instant 100% free Telegram OTP delivery:")
    print("1. Open Telegram and search for @BotFather")
    print("2. Send '/newbot', give it a name (e.g. 'KnowledgeSphereAuthBot'), and copy the HTTP API Token.")
    print("3. Start a chat with your bot (click 'START').")
    print("4. Find your Chat ID by searching @userinfobot on Telegram (or send a message to your bot and visit:")
    print("   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates)")
    print("5. Add both into your .env file:")
    print("   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRstuVWXyz")
    print("   TELEGRAM_CHAT_ID=123456789\n")
    sys.exit(0)

print(f"\n[*] Configured Bot Token : {bot_token[:8]}...{bot_token[-5:]}")
print(f"[*] Configured Chat ID   : {chat_id}")
print("\n[*] Sending test OTP notification to Telegram...")

test_code = "741852"
text = (
    "🔐 *KnowledgeSphere AI — 2FA Security Code*\n\n"
    "👤 *Recipient:* `admin@knowledgesphere.ai`\n"
    f"🔢 *Verification Code:* `{test_code}`\n"
    "⏱ *Valid for:* 5 minutes\n\n"
    "🛡 _This is a test notification verifying your Telegram 2FA bot configuration._"
)

url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
payload = json.dumps({
    "chat_id": chat_id,
    "text": text,
    "parse_mode": "Markdown"
}).encode("utf-8")

req = urllib.request.Request(
    url,
    data=payload,
    headers={"Content-Type": "application/json", "User-Agent": "KnowledgeSphereAI-2FA/1.0"}
)

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        if response.status == 200:
            resp_data = json.loads(response.read().decode("utf-8"))
            if resp_data.get("ok"):
                print("\n[SUCCESS] Notification delivered to your Telegram app!")
                print("Your 2FA bot is active and ready for live logins.\n")
            else:
                print(f"\n[ERROR] Telegram API returned: {resp_data}")
        else:
            print(f"\n[ERROR] HTTP Status: {response.status}")
except Exception as exc:
    print(f"\n[FAILED] Unable to reach Telegram API: {exc}")
    print("Please verify your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.")
