const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const horizontalTrack = document.getElementById('horizontalTrack');
const navItems = [...document.querySelectorAll('.nav-link')];
const horizontalPanels = [...horizontalTrack.querySelectorAll('.horizontal-panel')];
const sections = navItems
  .map(link => document.getElementById(link.getAttribute('data-target')))
  .filter(Boolean);

menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

navItems.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  });
});

let slideAnimationFrame = 0;

function scrollToPanel(panel, behavior = 'smooth') {
  const trackLeft = horizontalTrack.getBoundingClientRect().left;
  const panelLeft = panel.getBoundingClientRect().left;
  const startLeft = horizontalTrack.scrollLeft;
  const targetLeft = startLeft + panelLeft - trackLeft;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.cancelAnimationFrame(slideAnimationFrame);

  if (behavior === 'instant' || reduceMotion || Math.abs(targetLeft - startLeft) < 1) {
    horizontalTrack.scrollLeft = targetLeft;
    updateActiveNav();
    return;
  }

  const duration = 560;
  const startedAt = performance.now();
  horizontalTrack.style.scrollSnapType = 'none';

  const animate = now => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const easedProgress = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;

    horizontalTrack.scrollLeft = startLeft + (targetLeft - startLeft) * easedProgress;

    if (progress < 1) {
      slideAnimationFrame = window.requestAnimationFrame(animate);
      return;
    }

    horizontalTrack.scrollLeft = targetLeft;
    horizontalTrack.style.scrollSnapType = '';
    updateActiveNav();
  };

  slideAnimationFrame = window.requestAnimationFrame(animate);
}

// Removed URL hash handling - navigation now works without changing URL

document.addEventListener('click', event => {
  const link = event.target.closest('[data-target]');
  if (!link) return;

  const targetId = link.getAttribute('data-target');
  const target = document.getElementById(targetId);
  if (!target?.classList.contains('horizontal-panel')) return;

  event.preventDefault();
  scrollToPanel(target);
});

let wheelNavigationLocked = false;

horizontalTrack.addEventListener('wheel', event => {
  const panel = event.target.closest('.horizontal-panel');
  const isVerticalWheel = Math.abs(event.deltaY) > Math.abs(event.deltaX);

  if (!panel || !isVerticalWheel) return;

  const canScrollPanel = panel.scrollHeight > panel.clientHeight;
  const panelCanMoveVertically = event.deltaY < 0
    ? panel.scrollTop > 0
    : panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;

  if (canScrollPanel && panelCanMoveVertically) return;

  event.preventDefault();
  if (wheelNavigationLocked) return;

  const currentIndex = Math.round(horizontalTrack.scrollLeft / horizontalTrack.clientWidth);
  const nextIndex = Math.max(
    0,
    Math.min(currentIndex + Math.sign(event.deltaY), horizontalPanels.length - 1)
  );

  if (nextIndex === currentIndex) return;

  wheelNavigationLocked = true;
  scrollToPanel(horizontalPanels[nextIndex]);
  window.setTimeout(() => {
    wheelNavigationLocked = false;
  }, 650);
}, { passive: false });

function updateActiveNav() {
  const activeIndex = Math.min(
    Math.round(horizontalTrack.scrollLeft / horizontalTrack.clientWidth),
    sections.length - 1
  );
  const activeId = sections[activeIndex]?.id;

  navItems.forEach(link => {
    const isActive = link.getAttribute('data-target') === activeId;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  horizontalPanels.forEach((panel, index) => {
    panel.classList.toggle('is-active', index === activeIndex);
  });
}

horizontalTrack.addEventListener('scroll', updateActiveNav, { passive: true });
window.addEventListener('resize', updateActiveNav);

// Initial panel navigation removed - always start at home

// Remove hash from URL if present
if (window.location.hash) {
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (error) {
    // Fallback for environments that block replaceState
    window.location.hash = '';
  }
}

updateActiveNav();

document.getElementById('contactForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = form.get('name');
  const email = form.get('email');
  const message = form.get('message');
  const subject = encodeURIComponent(`Portfolio message from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:mocharisandijayanto@gmail.com?subject=${subject}&body=${body}`;
});

// Alternate the role text under the name in the header
const roleTexts = [...document.querySelectorAll('.logo-role')];

if (roleTexts.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let activeRole = 0;

  window.setInterval(() => {
    roleTexts[activeRole].classList.remove('is-active');
    activeRole = (activeRole + 1) % roleTexts.length;
    roleTexts[activeRole].classList.add('is-active');
  }, 3500);
}

// Load more functionality for hero description
const loadMoreBtn = document.getElementById('loadMoreBtn');
const heroDescription = document.querySelector('.hero-description');

if (loadMoreBtn && heroDescription) {
  loadMoreBtn.addEventListener('click', () => {
    const isExpanded = heroDescription.classList.toggle('expanded');
    loadMoreBtn.setAttribute('aria-expanded', String(isExpanded));
    loadMoreBtn.querySelector('span:first-child').textContent = isExpanded ? 'Show less' : 'Read more';
    
    // Scroll to description when expanding to prevent content from being hidden behind header
    if (isExpanded) {
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const descriptionTop = heroDescription.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: descriptionTop - headerHeight - 20,
        behavior: 'smooth'
      });
    }
  });
}
