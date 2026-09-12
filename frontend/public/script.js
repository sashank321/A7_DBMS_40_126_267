document.addEventListener('DOMContentLoaded', () => {
  // 1. Hamburger Menu
  const hamburger = document.querySelector('.site-header-hamburger');
  const mobileMenu = document.querySelector('.site-header-mobile-menu');
  const overlay = document.querySelector('.site-header-overlay');
  
  if (hamburger && mobileMenu && overlay) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
    overlay.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // 2. Typing Animation
  const typingSpan = document.querySelector('.typing-container span:first-child');
  if (typingSpan) {
    const commands = [
      "agent find me cheap flights to tokyo",
      "agent summarize this article",
      "agent draft an email reply",
      "agent buy these items on amazon"
    ];
    let cmdIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentCmd = commands[cmdIndex];
      if (isDeleting) {
        typingSpan.textContent = currentCmd.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingSpan.textContent = currentCmd.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 30 : 70;

      if (!isDeleting && charIndex === currentCmd.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        cmdIndex = (cmdIndex + 1) % commands.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    }
    setTimeout(type, 1000);
  }

  // 3. 3D Computer Mouse Tracking
  const scene = document.querySelector('.scene');
  if (scene) {
    window.addEventListener('mousemove', (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;
      scene.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    });
  }

  // 4. Products Menu Toggle
  const prodTrigger = document.querySelector('.site-header-products-trigger');
  const prodMenu = document.querySelector('.site-header-products-menu');
  if (prodTrigger && prodMenu) {
    prodTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      prodMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      prodMenu.classList.remove('active');
    });
  }
});
