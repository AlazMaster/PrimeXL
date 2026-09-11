/* fx.js — DeathKO Prime XL (Resend varyantı)
   Üç bağımsız görsel katman:
   1) Boot sekansı   — terminal tarzı açılış, oturum başına bir kez oynar.
   2) Scroll reveal   — bölümler kaydırdıkça sahneye giriyor.
   3) Ambiyans parçacıkları — sayfanın arkasında sürekli akan mor kor efekti.
   Hepsi tamamen görsel; form/backend davranışına hiçbir etkisi yoktur. */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var isSmallScreen = window.innerWidth < 620;

  /* ------------------------------------------------------------------ */
  /* 1) BOOT SEQUENCE                                                    */
  /* ------------------------------------------------------------------ */
  function initBoot() {
    var overlay = document.getElementById('bootOverlay');
    if (!overlay) return;

    // JS artık kontrolde — CSS'teki no-JS güvenlik animasyonunu iptal et.
    overlay.style.animation = 'none';

    var alreadyBooted = document.documentElement.classList.contains('dko-skip-boot');
    if (alreadyBooted || reduceMotion || isSmallScreen) {
      overlay.style.display = 'none';
      return;
    }

    var finished = false;
    function finishBoot() {
      if (finished) return;
      finished = true;
      overlay.classList.add('boot-done');
      try { sessionStorage.setItem('dko_booted', '1'); } catch (e) {}
      document.removeEventListener('keydown', onSkip);
      overlay.removeEventListener('click', onSkip);
    }
    function onSkip() { finishBoot(); }

    overlay.addEventListener('click', onSkip);
    document.addEventListener('keydown', onSkip);
    // Mutlak güvenlik ağı: ne olursa olsun 6 saniyeyi geçmesin.
    window.setTimeout(finishBoot, 6000);

    var lines = Array.prototype.slice.call(overlay.querySelectorAll('.boot-line'));
    var lineIndex = 0;

    function typeLine() {
      if (finished) return;
      if (lineIndex >= lines.length) {
        window.setTimeout(finishBoot, 320);
        return;
      }
      var el = lines[lineIndex];
      var text = el.getAttribute('data-text') || '';
      el.textContent = '';
      el.classList.add('boot-active');
      var charIndex = 0;
      var timer = window.setInterval(function () {
        if (finished) { window.clearInterval(timer); return; }
        charIndex++;
        el.textContent = '> ' + text.slice(0, charIndex);
        if (charIndex >= text.length) {
          window.clearInterval(timer);
          el.classList.remove('boot-active');
          lineIndex++;
          window.setTimeout(typeLine, 200);
        }
      }, 16);
    }

    try {
      window.setTimeout(typeLine, 220);
    } catch (e) {
      finishBoot();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 2) SCROLL REVEAL                                                    */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { root: null, threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* 3) AMBIENT PARTICLES                                                */
  /* ------------------------------------------------------------------ */
  function initAmbient() {
    if (reduceMotion || isSmallScreen) return;
    var canvas = document.getElementById('ambientCanvas');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var width = 0, height = 0;
    var running = true;
    var rafId = null;

    var mouseX = 0, mouseY = 0, offsetX = 0, offsetY = 0;

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      seed();
    }

    function makeParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.5 + 0.5) * dpr,
        vy: -(Math.random() * 0.16 + 0.04) * dpr,
        vx: (Math.random() - 0.5) * 0.05 * dpr,
        a: Math.random() * 0.5 + 0.15,
        violet: Math.random() < 0.6
      };
    }

    function seed() {
      var target = Math.max(14, Math.min(42, Math.round((width * height) / 26000)));
      particles = [];
      for (var i = 0; i < target; i++) particles.push(makeParticle());
    }

    function onMouseMove(e) {
      mouseX = (e.clientX / Math.max(1, window.innerWidth)) - 0.5;
      mouseY = (e.clientY / Math.max(1, window.innerHeight)) - 0.5;
    }

    function step() {
      if (!running) return;
      offsetX += (mouseX * -8 * dpr - offsetX) * 0.03;
      offsetY += (mouseY * -6 * dpr - offsetY) * 0.03;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(offsetX, offsetY);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        var color = p.violet ? '146,129,247' : '186,167,255';
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, 'rgba(' + color + ',' + p.a + ')');
        grad.addColorStop(1, 'rgba(' + color + ',0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(step);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        rafId = window.requestAnimationFrame(step);
      }
    }

    var resizeTimer = null;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }

    try {
      resize();
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      rafId = window.requestAnimationFrame(step);
    } catch (e) {
      running = false;
    }
  }

  function boot() {
    initBoot();
    initReveal();
    initAmbient();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
