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
let touchStartY = 0;
let touchEndY = 0;

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

// Touch swipe navigation for mobile
horizontalTrack.addEventListener('touchstart', event => {
  touchStartY = event.touches[0].clientY;
}, { passive: true });

horizontalTrack.addEventListener('touchmove', event => {
  const panel = event.target.closest('.horizontal-panel');
  if (!panel) return;

  const canScrollPanel = panel.scrollHeight > panel.clientHeight;
  const panelCanMoveVertically = event.touches[0].clientY < touchStartY
    ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1
    : panel.scrollTop > 0;

  if (canScrollPanel && panelCanMoveVertically) return;

  touchEndY = event.touches[0].clientY;
}, { passive: true });

horizontalTrack.addEventListener('touchend', event => {
  const panel = event.target.closest('.horizontal-panel');
  if (!panel) return;

  const swipeDistance = touchStartY - touchEndY;
  const minSwipeDistance = 50;

  if (Math.abs(swipeDistance) < minSwipeDistance) return;

  const canScrollPanel = panel.scrollHeight > panel.clientHeight;
  const panelCanMoveVertically = swipeDistance > 0
    ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1
    : panel.scrollTop > 0;

  if (canScrollPanel && panelCanMoveVertically) return;

  if (wheelNavigationLocked) return;

  const currentIndex = Math.round(horizontalTrack.scrollLeft / horizontalTrack.clientWidth);
  const nextIndex = Math.max(
    0,
    Math.min(currentIndex + Math.sign(swipeDistance), horizontalPanels.length - 1)
  );

  if (nextIndex === currentIndex) return;

  wheelNavigationLocked = true;
  scrollToPanel(horizontalPanels[nextIndex]);
  window.setTimeout(() => {
    wheelNavigationLocked = false;
  }, 650);
}, { passive: true });

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

// Project modal functionality
const projectModal = document.getElementById('projectModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalFooterClose = document.getElementById('modalFooterClose');
const modalImageContainer = document.getElementById('modalImageContainer');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalTech = document.getElementById('modalTech');
const modalHeaderCategory = document.getElementById('modalHeaderCategory');
const modalHeaderType = document.getElementById('modalHeaderType');
const modalTechCount = document.getElementById('modalTechCount');
const modalFeatureCount = document.getElementById('modalFeatureCount');
const modalFeatures = document.getElementById('modalFeatures');
const modalGithub = document.getElementById('modalGithub');

const imageModal = document.getElementById('imageModal');
const imageModalOverlay = document.getElementById('imageModalOverlay');
const imageModalClose = document.getElementById('imageModalClose');
const fullSizeImage = document.getElementById('fullSizeImage');

const alertModal = document.getElementById('alertModal');
const alertModalOverlay = document.getElementById('alertModalOverlay');
const alertModalClose = document.getElementById('alertModalClose');

const projectData = {
  jstore: {
    number: '#01',
    category: 'WEB APP',
    headerCategory: 'GAME STORE',
    headerType: 'WEB APPLICATION',
    title: 'J-Store – Game Currency Store Platform',
    description: 'J-Store adalah sebuah toko mata uang game untuk game populer seperti Genshin Impact. Platform ini menyediakan layanan pembelian mata uang game dengan sistem yang aman dan terpercaya.',
    features: [
      'Menampilkan berbagai produk mata uang game dengan harga yang kompetitif',
      'Proses pembayaran yang aman dengan berbagai metode pembayaran',
      'Tracking pesanan secara real-time untuk pengalaman terbaik'
    ],
    tech: ['HTML', 'CSS', 'JavaScript'],
    image: 'img/jstore(tampilan).png',
    link: 'https://github.com/vanargand29/J-Store',
    github: 'https://github.com/vanargand29/J-Store'
  },
  tuberculosis: {
    number: '#02',
    category: 'WEB APP',
    headerCategory: 'HEALTHCARE',
    headerType: 'EXPERT SYSTEM',
    title: 'Tuberculosis Expert System – AI-Powered Disease Screening Platform',
    description: 'Tuberculosis Expert System adalah aplikasi web untuk membantu skrining pasien berdasarkan gejala mereka menggunakan metode Dempster-Shafer. Sistem ini memberikan rekomendasi diagnosis yang akurat untuk tenaga kesehatan.',
    features: [
      'Form input untuk memasukkan gejala pasien secara lengkap',
      'Proses diagnosis otomatis menggunakan algoritma Dempster-Shafer',
      'Menampilkan hasil diagnosis dengan probabilitas dan rekomendasi'
    ],
    tech: ['Laravel', 'MySQL', 'Dempster-Shafer'],
    image: 'https://via.placeholder.com/800x600/292c31/ff2028?text=Tuberculosis+Expert+System',
    link: '#',
    github: '#'
  },
  portfolio: {
    number: '#03',
    category: 'PERSONAL',
    headerCategory: 'PORTFOLIO',
    headerType: 'PERSONAL WEBSITE',
    title: 'Personal Portfolio – Modern Portfolio Website',
    description: 'Personal Portfolio adalah website untuk memperkenalkan profil, skill, dan karya saya. Website ini menampilkan informasi tentang diri saya, proyek yang pernah dikerjakan, serta cara untuk menghubungi saya.',
    features: [
      'Bagian pembuka dengan informasi diri dan animasi yang menarik',
      'Informasi detail tentang diri saya dan skill yang dimiliki',
      'Daftar proyek yang pernah dikerjakan dengan popup modal',
      'Informasi pengalaman kerja, pendidikan, dan sertifikasi',
      'Form kontak untuk mengirim pesan langsung ke email'
    ],
    tech: ['Responsive', 'UI Design', 'HTML/CSS/JS'],
    image: 'img/porto(tampilan).png',
    link: '#',
    github: '#'
  }
};

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    const projectId = card.getAttribute('data-project');
    const data = projectData[projectId];

    if (!data) return;

    modalHeaderCategory.textContent = data.headerCategory;
    modalHeaderType.textContent = data.headerType;
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;
    modalTechCount.textContent = data.tech.length;
    modalFeatureCount.textContent = data.features.length;
    modalImage.src = data.image;
    modalImage.alt = data.title;
    modalGithub.href = data.github;

    modalTech.innerHTML = '';
    data.tech.forEach(tech => {
      const span = document.createElement('span');
      span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>${tech}`;
      modalTech.appendChild(span);
    });

    modalFeatures.innerHTML = '';
    data.features.forEach(feature => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${feature}</span>`;
      modalFeatures.appendChild(li);
    });

    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
});

// Image modal
modalImageContainer.addEventListener('click', () => {
  fullSizeImage.src = modalImage.src;
  imageModal.setAttribute('aria-hidden', 'false');
});

function closeImageModal() {
  imageModal.setAttribute('aria-hidden', 'true');
}

imageModalClose.addEventListener('click', closeImageModal);
imageModalOverlay.addEventListener('click', closeImageModal);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && imageModal.getAttribute('aria-hidden') === 'false') {
    closeImageModal();
  }
});

// Alert modal for GitHub
modalGithub.addEventListener('click', (e) => {
  e.preventDefault();
  alertModal.setAttribute('aria-hidden', 'false');
});

function closeAlertModal() {
  alertModal.setAttribute('aria-hidden', 'true');
}

alertModalClose.addEventListener('click', closeAlertModal);
alertModalOverlay.addEventListener('click', closeAlertModal);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && alertModal.getAttribute('aria-hidden') === 'false') {
    closeAlertModal();
  }
});

// Contact button navigation
document.querySelectorAll('[data-target="contact"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    setTimeout(() => {
      const contactPanel = document.querySelector('.horizontal-panel[data-section="contact"]');
      if (contactPanel) {
        scrollToPanel(contactPanel);
      }
    }, 300);
  });
});

function closeModal() {
  projectModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
if (modalFooterClose) {
  modalFooterClose.addEventListener('click', closeModal);
}
modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && projectModal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

// Certificate filtering functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const certItems = document.querySelectorAll('.cert-item');
const filterDropdownToggle = document.getElementById('filterDropdownToggle');
const filterDropdownMenu = document.getElementById('filterDropdownMenu');
const currentFilterLabel = document.getElementById('currentFilterLabel');

// Dropdown toggle functionality
if (filterDropdownToggle && filterDropdownMenu) {
  filterDropdownToggle.addEventListener('click', () => {
    filterDropdownToggle.classList.toggle('open');
    filterDropdownMenu.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterDropdownToggle.contains(e.target) && !filterDropdownMenu.contains(e.target)) {
      filterDropdownToggle.classList.remove('open');
      filterDropdownMenu.classList.remove('open');
    }
  });
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    button.classList.add('active');

    const filterValue = button.getAttribute('data-filter');

    // Update dropdown label if exists
    if (currentFilterLabel) {
      currentFilterLabel.textContent = button.querySelector('span').textContent;
    }

    // Close dropdown after selection
    if (filterDropdownToggle && filterDropdownMenu) {
      filterDropdownToggle.classList.remove('open');
      filterDropdownMenu.classList.remove('open');
    }

    certItems.forEach(item => {
      if (filterValue === 'all') {
        item.classList.remove('hidden');
      } else {
        const itemCategory = item.getAttribute('data-category');
        if (itemCategory === filterValue) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      }
    });
  });
});

// Timeline read more functionality
const timelineReadMoreButtons = document.querySelectorAll('.timeline-description .load-more-btn');

timelineReadMoreButtons.forEach(button => {
  button.addEventListener('click', () => {
    const isExpanded = button.previousElementSibling.classList.toggle('expanded');
    button.setAttribute('aria-expanded', String(isExpanded));
    button.querySelector('span:first-child').textContent = isExpanded ? 'Show less' : 'Read more';
  });
});
