(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeButton = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const progress = document.querySelector('.scroll-progress');
  const header = document.querySelector('.site-header');
  const toTop = document.querySelector('.to-top');
  const cursorGlow = document.querySelector('.cursor-glow');
  const navLinks = [...document.querySelectorAll('.primary-nav a')];

  // Theme: use the saved preference, with the initial HTML script as fallback.
  function applyTheme(theme, animate = true) {
    if (animate && !reducedMotion) {
      root.classList.add('theme-anim');
      window.setTimeout(() => root.classList.remove('theme-anim'), 550);
    }
    root.dataset.theme = theme;
    if (themeButton) {
      const dark = theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeButton.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0c181d' : '#f7f6ef');
  }

  let savedTheme = null;
  try { savedTheme = localStorage.getItem('theme'); } catch (_) {}
  applyTheme(savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : (root.dataset.theme === 'dark' ? 'dark' : 'light'), false);

  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (_) {}
  });

  // Mobile navigation: close after selection, outside click, or Escape.
  function setMenu(open) {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (nav?.classList.contains('open') &&
        !nav.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) setMenu(false);
  }, { passive: true });

  // Scroll-linked UI is updated in one animation frame for smooth performance.
  let scrollTicking = false;
  function updateScrollUI() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    header?.classList.toggle('scrolled', window.scrollY > 24);
    toTop?.classList.toggle('show', window.scrollY > 480);

    const timeline = document.querySelector('.experience-list');
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.72;
      const end = -rect.height + window.innerHeight * 0.28;
      const amount = Math.min(1, Math.max(0, (start - rect.top) / Math.max(1, start - end)));
      timeline.style.setProperty('--tl', String(amount));
    }
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // Scroll reveal: content remains visible if IntersectionObserver is unavailable.
  const revealTargets = document.querySelectorAll(
    '.focus-card, .intro-copy, .skill-card, .experience-item, .project-card, ' +
    '.publication-copy, .education-card, .certification-panel, .achievement-grid article, ' +
    '.contact-main, .contact-details'
  );
  if (!reducedMotion && 'IntersectionObserver' in window) {
    // Keep the reveal effect reliable on touch browsers: use a modest threshold
    // and a mobile-friendly root margin so short cards animate as they enter view.
    const isTouchLayout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--d', `${(index % (isTouchLayout ? 3 : 4)) * (isTouchLayout ? 55 : 70)}ms`);
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: isTouchLayout ? 0.04 : 0.12,
      rootMargin: isTouchLayout ? '0px 0px -8% 0px' : '0px 0px -35px 0px'
    });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    // Never leave content hidden if motion is disabled or observation is unsupported.
    revealTargets.forEach(element => element.classList.add('in'));
  }

  // Animate numeric stats when they enter view.
  const counters = document.querySelectorAll('.count[data-to]');
  function animateCounter(el) {
    const target = Number(el.dataset.to);
    if (!Number.isFinite(target)) return;
    if (reducedMotion) { el.textContent = String(target); return; }
    const duration = 1100;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.65 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else {
    counters.forEach(counter => { counter.textContent = counter.dataset.to; });
  }

  // Active section state for desktop and mobile navigation.
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-32% 0px -58% 0px', threshold: 0 });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Subtle pointer glow and card spotlight on mouse/trackpad devices only.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.skill-card, .project-card, .focus-card, .education-card').forEach(card => {
      card.classList.add('spot');
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
    if (cursorGlow) {
      let glowX = 0, glowY = 0;
      document.addEventListener('pointermove', event => {
        glowX = event.clientX - 210;
        glowY = event.clientY - 210;
        cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
        cursorGlow.classList.add('on');
      }, { passive: true });
      document.addEventListener('pointerleave', () => cursorGlow.classList.remove('on'));
    }
  }

  // Small magnetic response on the main contact CTA, disabled for touch/reduced motion.
  const magnetic = document.querySelector('.contact-link');
  if (finePointer && !reducedMotion && magnetic) {
    magnetic.addEventListener('pointermove', event => {
      const rect = magnetic.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.035;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.08;
      magnetic.style.transform = `translate(${x}px, ${y}px)`;
    });
    magnetic.addEventListener('pointerleave', () => { magnetic.style.transform = ''; });
  }


  // Project details open in a focused dialog instead of expanding the project card.
  let lastProjectTrigger = null;
  let projectBackdrop = null;

  function ensureProjectModal() {
    if (projectBackdrop) return projectBackdrop;
    projectBackdrop = document.createElement('div');
    projectBackdrop.className = 'project-modal-backdrop';
    projectBackdrop.innerHTML = `
      <section class="project-modal" role="dialog" aria-modal="true"
        aria-labelledby="project-modal-title" tabindex="-1">
        <header class="project-modal-header">
          <div class="project-modal-heading">
            <p class="project-modal-kicker">PROJECT DETAILS</p>
            <h2 class="project-modal-title" id="project-modal-title"></h2>
          </div>
          <button class="project-modal-close" type="button" aria-label="Close project details">×</button>
        </header>
        <div class="project-modal-content"></div>
      </section>`;
    document.body.appendChild(projectBackdrop);

    const closeButton = projectBackdrop.querySelector('.project-modal-close');
    closeButton.addEventListener('click', closeProjectModal);
    projectBackdrop.addEventListener('click', event => {
      if (event.target === projectBackdrop) closeProjectModal();
    });
    projectBackdrop.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...projectBackdrop.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter(el => el.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    return projectBackdrop;
  }

  function openProjectModal(details, trigger) {
    const card = details.closest('.project-card');
    const title = card?.querySelector('.project-content h3')?.textContent?.trim() || 'Project details';
    const category = card?.querySelector('.project-category')?.textContent?.trim() || 'PROJECT DETAILS';
    const backdrop = ensureProjectModal();
    backdrop.querySelector('.project-modal-kicker').textContent = category;
    backdrop.querySelector('.project-modal-title').textContent = title;

    const content = backdrop.querySelector('.project-modal-content');
    content.replaceChildren(details.cloneNode(true));
    // Keep the original content's typography and lists, but remove its disclosure wrapper.
    const clonedDetails = content.querySelector('.details-body');
    if (clonedDetails) content.replaceChildren(...clonedDetails.childNodes);

    lastProjectTrigger = trigger;
    document.body.classList.add('project-modal-open');
    backdrop.classList.add('is-open');
    requestAnimationFrame(() => backdrop.querySelector('.project-modal-close').focus());
  }

  function closeProjectModal() {
    if (!projectBackdrop) return;
    projectBackdrop.classList.remove('is-open');
    document.body.classList.remove('project-modal-open');
    lastProjectTrigger?.focus();
    lastProjectTrigger = null;
  }

  document.querySelectorAll('.project-details summary').forEach(summary => {
    summary.addEventListener('click', event => {
      event.preventDefault();
      const details = summary.closest('.project-details');
      if (details) openProjectModal(details, summary);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && projectBackdrop?.classList.contains('is-open')) {
      closeProjectModal();
    }
  });

  // Footer year.
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
