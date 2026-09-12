document.addEventListener('DOMContentLoaded', () => {
  const dpr = window.devicePixelRatio || 1;

  // ==========================================
  // 1. Bento Grid Interactive Canvas Animations
  // ==========================================

  // --- CARD 1: Constellation Nodes & Bipartite Flow Mesh ---
  const card1 = document.querySelector('#card-1');
  const card1Canvas = card1?.querySelector('canvas');
  if (card1Canvas && card1) {
    const ctx = card1Canvas.getContext('2d');
    let particles = [];
    let w = 0, h = 0;

    function resize1() {
      const p = card1Canvas.parentElement;
      if (p) {
        w = p.clientWidth;
        h = p.clientHeight;
        card1Canvas.width = w * dpr;
        card1Canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        particles = [];
        for (let i = 0; i < 35; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2
          });
        }
      }
    }

    function loop1() {
      if (ctx && w > 0) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#5B7553';
        ctx.strokeStyle = '#5B7553';
        ctx.lineWidth = 1;

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          for (const p2 of particles) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.globalAlpha = Math.max(0, 1 - dist / 110);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }
      requestAnimationFrame(loop1);
    }
    resize1();
    loop1();
    window.addEventListener('resize', resize1);
  }

  // --- CARD 2: Binary Digital Rain (Invariant Verification Stream) ---
  const card2 = document.querySelector('#card-2');
  const card2Canvas = card2?.querySelector('canvas');
  if (card2Canvas && card2) {
    const ctx = card2Canvas.getContext('2d');
    const chars = '01';
    const fontSize = 14;
    let cols = [];
    let w = 0, h = 0;

    function resize2() {
      const p = card2Canvas.parentElement;
      if (p) {
        w = p.clientWidth;
        h = p.clientHeight;
        card2Canvas.width = w * dpr;
        card2Canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        const count = Math.floor(w / fontSize);
        cols = [];
        for (let i = 0; i < count; i++) cols[i] = Math.floor(Math.random() * 20);
      }
    }

    card2.addEventListener('mouseenter', () => {
      if (ctx && w > 0) ctx.clearRect(0, 0, w, h);
    });

    function loop2() {
      if (ctx && w > 0) {
        ctx.fillStyle = 'rgba(237, 233, 218, 0.12)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#7B6B8A';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < cols.length; i++) {
          const char = chars.charAt(Math.floor(Math.random() * chars.length));
          ctx.fillText(char, i * fontSize, cols[i] * fontSize);
          if (cols[i] * fontSize > h && Math.random() > 0.975) {
            cols[i] = 0;
          }
          cols[i]++;
        }
      }
      requestAnimationFrame(loop2);
    }
    resize2();
    loop2();
    window.addEventListener('resize', resize2);
  }

  // --- CARD 3: Orbital Conflict Constraint Boundary Radar ---
  const card3 = document.querySelector('#card-3');
  const card3Canvas = card3?.querySelector('canvas');
  if (card3Canvas && card3) {
    const ctx = card3Canvas.getContext('2d');
    let angle = 0;
    let w = 0, h = 0;

    function resize3() {
      const p = card3Canvas.parentElement;
      if (p) {
        w = p.clientWidth;
        h = p.clientHeight;
        card3Canvas.width = w * dpr;
        card3Canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }
    }

    function loop3() {
      if (ctx && w > 0) {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = '#B5764A';
        ctx.lineWidth = 1.2;

        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, 60 + i * 32, 30 + i * 16, angle + i * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }

        const radius = 120;
        const px = cx + Math.cos(angle * 2) * radius;
        const py = cy + Math.sin(angle * 2) * (radius * 0.5);
        ctx.fillStyle = '#0f0f0f';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        angle += 0.015;
      }
      requestAnimationFrame(loop3);
    }
    resize3();
    loop3();
    window.addEventListener('resize', resize3);
  }

  // --- CARD 4: Topic Affinity Multi-Frequency Superposition ---
  const card4 = document.querySelector('#card-4');
  const card4Canvas = card4?.querySelector('canvas');
  if (card4Canvas && card4) {
    const ctx = card4Canvas.getContext('2d');
    let time = 0;
    let w = 0, h = 0;

    function resize4() {
      const p = card4Canvas.parentElement;
      if (p) {
        w = p.clientWidth;
        h = p.clientHeight;
        card4Canvas.width = w * dpr;
        card4Canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }
    }

    function loop4() {
      if (ctx && w > 0) {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 2.2;
        const colors = ['#8A5A44', '#7B6B8A', '#5B7553'];

        for (let m = 0; m < 3; m++) {
          ctx.strokeStyle = colors[m];
          ctx.beginPath();
          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * 0.012 + time + m * 0.8) * 35 * Math.sin(time * 0.6 + m);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        time += 0.04;
      }
      requestAnimationFrame(loop4);
    }
    resize4();
    loop4();
    window.addEventListener('resize', resize4);
  }

  // --- CARD 5: Benchmark Lab Histogram Equalizer ---
  const card5 = document.querySelector('#card-5');
  const card5Canvas = card5?.querySelector('canvas');
  if (card5Canvas && card5) {
    const ctx = card5Canvas.getContext('2d');
    const numBars = 22;
    const heights = new Array(numBars).fill(0);
    let w = 0, h = 0;

    function resize5() {
      const p = card5Canvas.parentElement;
      if (p) {
        w = p.clientWidth;
        h = p.clientHeight;
        card5Canvas.width = w * dpr;
        card5Canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }
    }

    function loop5() {
      if (ctx && w > 0) {
        ctx.clearRect(0, 0, w, h);
        const barWidth = w / numBars;
        ctx.fillStyle = '#0f0f0f';

        for (let c = 0; c < numBars; c++) {
          const target = Math.random() * h * 0.85;
          heights[c] += (target - heights[c]) * 0.15;
          const barH = Math.max(4, heights[c]);
          ctx.fillRect(c * barWidth, h - barH, barWidth - 3, barH);
        }
      }
      requestAnimationFrame(loop5);
    }
    resize5();
    loop5();
    window.addEventListener('resize', resize5);
  }

  // ==========================================
  // 2. Header Products Dropdown
  // ==========================================
  const prodTrigger = document.querySelector('.site-header-products-trigger');
  const prodMenu = document.querySelector('.site-header-products-menu');
  if (prodTrigger && prodMenu) {
    prodTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      prodMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (!prodMenu.contains(e.target) && !prodTrigger.contains(e.target)) {
        prodMenu.classList.remove('active');
      }
    });
  }

  // ==========================================
  // 3. Typing Animation in 3D CRT Terminal
  // ==========================================
  const typingSpan = document.querySelector('.typing-container span:first-child');
  if (typingSpan) {
    const commands = [
      "allocflow build-network --papers 120 --reviewers 45",
      "allocflow run dinic --verify-coi --max-load 4",
      "allocflow verify-invariants --ff --ek --dinic",
      "allocflow generate-proofs --sha256",
      "allocflow export-assignments --format json"
    ];
    let cmdIdx = 0;
    let charIdx = 0;
    let deleting = false;

    function typeLoop() {
      const text = commands[cmdIdx];
      if (deleting) {
        typingSpan.textContent = text.substring(0, charIdx - 1);
        charIdx--;
      } else {
        typingSpan.textContent = text.substring(0, charIdx + 1);
        charIdx++;
      }

      let speed = deleting ? 20 : 50;
      if (!deleting && charIdx === text.length) {
        speed = 2000;
        deleting = true;
      } else if (deleting && charIdx === 0) {
        deleting = false;
        cmdIdx = (cmdIdx + 1) % commands.length;
        speed = 350;
      }
      setTimeout(typeLoop, speed);
    }
    setTimeout(typeLoop, 600);
  }

  // ==========================================
  // 4. 3D Computer Mouse Parallax Movement
  // ==========================================
  const scene = document.querySelector('.scene');
  const productCol = document.querySelector('.product-col');
  if (scene && productCol) {
    productCol.addEventListener('mousemove', (e) => {
      const rect = productCol.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 18;
      const y = (e.clientY - rect.top - rect.height / 2) / 18;
      scene.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    });
    productCol.addEventListener('mouseleave', () => {
      scene.style.transform = `rotateY(0deg) rotateX(0deg)`;
      scene.style.transition = 'transform 0.5s ease';
    });
    productCol.addEventListener('mouseenter', () => {
      scene.style.transition = 'none';
    });
  }

  // ==========================================
  // 5. Use Cases 3D Carousel (Authentic Physics Engine)
  // ==========================================
  const carouselContainer = document.querySelector('section[aria-label="Use cases carousel"]');
  const carouselCards = Array.from(document.querySelectorAll('.carousel-card-wrapper'));
  
  if (carouselContainer && carouselCards.length > 0) {
    let animPos = 0;
    let targetPos = 0;
    let velocity = 0;
    let isDragging = false;
    let lastClientX = 0;

    function getCardSpacing() {
      return window.innerWidth < 640 ? 280 : window.innerWidth < 768 ? 320 : 380;
    }

    function loopCarousel() {
      if (!isDragging) {
        targetPos += velocity;
        velocity *= 0.95;
        if (Math.abs(velocity) < 0.1) {
          targetPos += 0.29;
        }
      }

      animPos += (targetPos - animPos) * 0.115;

      const winW = window.innerWidth;
      const isMobile = winW < 768;
      const spacing = getCardSpacing();
      const depthFactor = isMobile ? 200 : 400;
      const angleFactor = isMobile ? 20 : 35;
      const totalLength = carouselCards.length * spacing;

      for (let k = 0; k < carouselCards.length; k++) {
        const card = carouselCards[k];
        if (!card) continue;

        let offset = k * spacing - animPos;
        while (offset < -totalLength / 2) offset += totalLength;
        while (offset > totalLength / 2) offset -= totalLength;

        if (Math.abs(offset) < winW * 0.8) {
          card.style.display = 'block';
          const normOffset = offset / (winW / 2.5);
          const posX = offset;
          const posZ = -(Math.pow(Math.abs(normOffset), 1.8)) * depthFactor;
          const rotY = normOffset * angleFactor;
          const opacity = Math.max(0, 1 - Math.pow(Math.abs(normOffset), 4));
          const zIndex = Math.round(100 - Math.abs(normOffset) * 100);

          card.style.transform = `translateX(${posX}px) translateZ(${posZ}px) rotateY(${rotY}deg)`;
          card.style.opacity = String(opacity);
          card.style.zIndex = String(zIndex);
        } else {
          card.style.display = 'none';
        }
      }

      requestAnimationFrame(loopCarousel);
    }
    loopCarousel();

    carouselContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastClientX = e.clientX;
      velocity = 0;
      carouselContainer.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        carouselContainer.style.cursor = 'grab';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastClientX;
      lastClientX = e.clientX;
      targetPos -= deltaX * 1.2;
      velocity = -deltaX * 0.4;
    });

    carouselContainer.addEventListener('touchstart', (e) => {
      isDragging = true;
      lastClientX = e.touches[0].clientX;
      velocity = 0;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - lastClientX;
      lastClientX = e.touches[0].clientX;
      targetPos -= deltaX * 1.2;
      velocity = -deltaX * 0.4;
    }, { passive: true });

    carouselCards.forEach((card, idx) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const spacing = getCardSpacing();
        targetPos = idx * spacing;
      });
    });
  }

  // ==========================================
  // 6. FAQ Accordions
  // ==========================================
  const faqItems = document.querySelectorAll('#faq .border-b, #faq [class*="border-b"]');
  faqItems.forEach((item) => {
    const button = item.querySelector('button');
    const answer = item.querySelector('div[style*="max-height"], .faq-answer')?.closest('div[style*="max-height"]') || item.querySelector('.faq-answer')?.parentElement;
    const icon = button?.querySelector('div[style*="border-color"], svg, span')?.closest('div[style*="rounded-full"], div[class*="rounded-full"]');

    if (button && answer) {
      button.addEventListener('click', () => {
        const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '0';
        
        faqItems.forEach((other) => {
          const otherAns = other.querySelector('div[style*="max-height"], .faq-answer')?.closest('div[style*="max-height"]') || other.querySelector('.faq-answer')?.parentElement;
          const otherIcon = other.querySelector('button div[class*="rounded-full"], button div[style*="rounded-full"]');
          if (otherAns && otherAns !== answer) {
            otherAns.style.maxHeight = '0px';
            otherAns.style.opacity = '0';
          }
          if (otherIcon && otherIcon !== icon) {
            otherIcon.style.transform = 'rotate(0deg)';
          }
        });

        if (isOpen) {
          answer.style.maxHeight = '0px';
          answer.style.opacity = '0';
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          answer.style.maxHeight = (answer.scrollHeight + 40) + 'px';
          answer.style.opacity = '1';
          if (icon) icon.style.transform = 'rotate(45deg)';
        }
      });
    }
  });

  // ==========================================
  // 7. Floating Notes Interactive Tilt
  // ==========================================
  const stickyNotes = document.querySelectorAll('.sticky-note, [class*="bg-"][class*="-note"]');
  stickyNotes.forEach(note => {
    note.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    note.addEventListener('mouseenter', () => {
      note.style.zIndex = '50';
      note.style.boxShadow = '0 20px 35px -10px rgba(0,0,0,0.2)';
    });
    note.addEventListener('mouseleave', () => {
      note.style.zIndex = '';
      note.style.boxShadow = '';
    });
  });
});
