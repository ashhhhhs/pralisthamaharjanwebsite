const body = document.body;
const header = document.querySelector("[data-header]");
const loader = document.querySelector("[data-loader]");
const progressBar = document.querySelector("[data-scroll-progress]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuClose = document.querySelector("[data-menu-close]");
const menuLinks = [...document.querySelectorAll(".menu-panel a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
const hero = document.querySelector(".hero");
const heroCollage = document.querySelector(".hero-collage");
const heroImages = [...document.querySelectorAll(".hero-img[data-depth]")];
const year = document.querySelector("[data-year]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const artCards = [...document.querySelectorAll("[data-art-card]")];
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxTitle = document.querySelector("[data-lightbox-title]");
const lightboxMedium = document.querySelector("[data-lightbox-medium]");
const lightboxDescription = document.querySelector("[data-lightbox-description]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointerFine = window.matchMedia("(pointer: fine)");

let ticking = false;
let activeArtworkIndex = 0;
let lastFocusedElement = null;

if (year) {
  year.textContent = new Date().getFullYear();
}

const finishLoading = () => {
  body.classList.add("is-ready");
  body.classList.remove("is-loading");
};

body.classList.add("is-loading");
window.addEventListener("load", () => window.setTimeout(finishLoading, 420), { once: true });
window.setTimeout(finishLoading, 1800);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
};

const setScrollProgress = () => {
  if (!progressBar) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
};

const setParallax = () => {
  if (reduceMotion.matches || window.innerWidth < 861) {
    parallaxItems.forEach((item) => item.style.setProperty("--parallax-y", "0px"));
    return;
  }

  const viewportCenter = window.innerHeight / 2;

  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const ratio = clamp((itemCenter - viewportCenter) / window.innerHeight, -1, 1);
    const strength = Number(item.dataset.parallax || 0);
    item.style.setProperty("--parallax-y", `${ratio * strength}px`);
  });
};

const updateScrollState = () => {
  ticking = false;
  setHeaderState();
  setScrollProgress();
  setParallax();
};

const requestScrollUpdate = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollState);
};

const openMenu = () => {
  menuPanel?.classList.add("is-open");
  menuPanel?.setAttribute("aria-hidden", "false");
  menuToggle?.setAttribute("aria-expanded", "true");
  body.classList.add("menu-open");
  window.setTimeout(() => menuClose?.focus(), 120);
};

const closeMenu = () => {
  menuPanel?.classList.remove("is-open");
  menuPanel?.setAttribute("aria-hidden", "true");
  menuToggle?.setAttribute("aria-expanded", "false");
  body.classList.remove("menu-open");
};

menuToggle?.addEventListener("click", () => {
  if (menuPanel?.classList.contains("is-open")) {
    closeMenu();
    return;
  }

  openMenu();
});

menuClose?.addEventListener("click", () => {
  closeMenu();
  menuToggle?.focus();
});

menuLinks.forEach((link) => link.addEventListener("click", closeMenu));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px" }
);

revealItems.forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index * 34, 260)}ms`);
  revealObserver.observe(item);
});

const resetHeroMotion = () => {
  heroCollage?.style.setProperty("--hero-rx", "0deg");
  heroCollage?.style.setProperty("--hero-ry", "0deg");
  heroImages.forEach((image) => {
    image.style.setProperty("--float-x", "0px");
    image.style.setProperty("--float-y", "0px");
  });
};

const setHeroMotion = (event) => {
  if (!hero || !heroCollage || reduceMotion.matches || !pointerFine.matches) return;

  const rect = hero.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
  const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);

  heroCollage.style.setProperty("--hero-rx", `${y * -4}deg`);
  heroCollage.style.setProperty("--hero-ry", `${x * 5}deg`);

  heroImages.forEach((image) => {
    const depth = Number(image.dataset.depth || 0);
    image.style.setProperty("--float-x", `${x * depth * 90}px`);
    image.style.setProperty("--float-y", `${y * depth * 70}px`);
  });
};

hero?.addEventListener("pointermove", setHeroMotion);
hero?.addEventListener("pointerleave", resetHeroMotion);

const visibleArtCards = () => artCards.filter((card) => !card.hidden);

const animateCardIn = (card) => {
  card.hidden = false;
  card.classList.add("is-filtering");

  if (reduceMotion.matches || !card.animate) {
    card.classList.remove("is-filtering");
    return;
  }

  card
    .animate(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    )
    .finished.finally(() => card.classList.remove("is-filtering"));
};

const animateCardOut = (card, activeFilter) => {
  card.classList.add("is-filtering");

  if (reduceMotion.matches || !card.animate) {
    card.hidden = true;
    card.classList.remove("is-filtering");
    return;
  }

  card
    .animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(18px)" },
      ],
      { duration: 220, easing: "ease" }
    )
    .finished.finally(() => {
      const stillHidden = activeFilter !== "all" && card.dataset.category !== activeFilter;
      card.hidden = stillHidden;
      card.classList.remove("is-filtering");
    });
};

const applyFilter = (filter) => {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  artCards.forEach((card) => {
    const shouldShow = filter === "all" || card.dataset.category === filter;
    card.tabIndex = shouldShow ? 0 : -1;

    if (shouldShow) {
      animateCardIn(card);
      return;
    }

    animateCardOut(card, filter);
  });
};

filterButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

const setLightboxContent = (card) => {
  if (!card || !lightboxImage || !lightboxTitle || !lightboxMedium || !lightboxDescription) return;

  lightboxImage.src = card.dataset.image;
  lightboxImage.alt = card.dataset.title;
  lightboxTitle.textContent = card.dataset.title;
  lightboxMedium.textContent = card.dataset.medium;
  lightboxDescription.textContent = card.dataset.description;
};

const openLightbox = (card) => {
  if (!lightbox || !card) return;

  const cards = visibleArtCards();
  activeArtworkIndex = Math.max(cards.indexOf(card), 0);
  lastFocusedElement = document.activeElement;
  setLightboxContent(card);

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  body.classList.add("lightbox-open");
  window.setTimeout(() => lightboxClose?.focus(), 90);
};

const closeLightbox = () => {
  if (!lightbox) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  body.classList.remove("lightbox-open");

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
};

const moveLightbox = (direction) => {
  const cards = visibleArtCards();
  if (!cards.length) return;

  activeArtworkIndex = (activeArtworkIndex + direction + cards.length) % cards.length;
  setLightboxContent(cards[activeArtworkIndex]);
};

artCards.forEach((card) => {
  card.addEventListener("click", () => openLightbox(card));
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openLightbox(card);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => moveLightbox(-1));
lightboxNext?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeLightbox();
  }

  if (!lightbox?.classList.contains("is-open")) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateScrollState();

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name");
  const email = formData.get("email");
  const project = formData.get("project");
  const message = formData.get("message");
  const subject = encodeURIComponent(`Art inquiry: ${project}`);
  const bodyText = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nProject: ${project}\n\n${message}`
  );

  if (formStatus) {
    formStatus.textContent = "Opening your email app with the inquiry ready to send.";
  }

  window.location.href = `mailto:pralisthamaharjan21@gmail.com?subject=${subject}&body=${bodyText}`;
});
