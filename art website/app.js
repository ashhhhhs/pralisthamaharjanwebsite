const body = document.body;
const header = document.querySelector("[data-header]");
const progressBar = document.querySelector("[data-scroll-progress]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuClose = document.querySelector("[data-menu-close]");
const menuLinks = [...document.querySelectorAll("[data-menu-link]")];
const revealItems = [...document.querySelectorAll(".reveal")];
const yearItems = [...document.querySelectorAll("[data-year]")];
const artCards = [...document.querySelectorAll("[data-art-card]")];
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxTitle = document.querySelector("[data-lightbox-title]");
const lightboxMedium = document.querySelector("[data-lightbox-medium]");
const lightboxDescription = document.querySelector("[data-lightbox-description]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const touchArtworkMode = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 759px)");

let activeArtworkIndex = 0;
let lastFocusedElement = null;
let ticking = false;

yearItems.forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const prepareArtworkImages = () => {
  artCards.forEach((card) => {
    const image = card.querySelector(":scope > img");
    if (!image) return;

    const shell = document.createElement("span");
    shell.className = "art-image-shell";
    image.before(shell);
    shell.append(image);

    const colorImage = image.cloneNode(false);
    colorImage.className = "art-color-image";
    colorImage.alt = "";
    colorImage.loading = "lazy";
    colorImage.setAttribute("aria-hidden", "true");
    shell.append(colorImage);
  });
};

prepareArtworkImages();

const updateScrollState = () => {
  ticking = false;
  header?.classList.toggle("is-scrolled", window.scrollY > 8);

  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
};

const requestScrollState = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollState);
};

const openMenu = () => {
  menuPanel?.classList.add("is-open");
  menuPanel?.setAttribute("aria-hidden", "false");
  menuToggle?.setAttribute("aria-expanded", "true");
  menuToggle?.setAttribute("aria-label", "Close menu");
  body.classList.add("menu-open");
  window.setTimeout(() => menuClose?.focus(), 120);
};

const closeMenu = () => {
  menuPanel?.classList.remove("is-open");
  menuPanel?.setAttribute("aria-hidden", "true");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open menu");
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

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -48px" }
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--delay", `${Math.min(index * 18, 160)}ms`);
    item.addEventListener(
      "transitionend",
      (event) => {
        if (event.target === item && event.propertyName === "transform") {
          item.classList.add("is-motion-done");
        }
      },
      { once: true }
    );
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible", "is-motion-done"));
}

const visibleArtworkRatios = new Map();

const setMobileColorArtwork = (activeCard) => {
  artCards.forEach((card) => {
    card.classList.toggle("is-mobile-color", card === activeCard);
  });
};

if ("IntersectionObserver" in window && touchArtworkMode.matches && artCards.length) {
  const colorObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleArtworkRatios.set(entry.target, entry.intersectionRatio);
          return;
        }

        visibleArtworkRatios.delete(entry.target);
      });

      const activeEntry = [...visibleArtworkRatios.entries()].sort((a, b) => b[1] - a[1])[0];
      setMobileColorArtwork(activeEntry?.[0] || null);
    },
    { threshold: [0.25, 0.45, 0.65, 0.85], rootMargin: "-18% 0px -26%" }
  );

  artCards.forEach((card) => colorObserver.observe(card));
}

const setLightboxContent = (card) => {
  if (!card || !lightboxImage || !lightboxTitle || !lightboxMedium || !lightboxDescription) return;

  lightboxImage.src = card.dataset.image;
  lightboxImage.alt = card.dataset.title || "";
  lightboxTitle.textContent = card.dataset.title || "";
  lightboxMedium.textContent = card.dataset.medium || "";
  lightboxDescription.textContent = card.dataset.description || "";
};

const openLightbox = (card) => {
  if (!lightbox || !card) return;

  activeArtworkIndex = Math.max(artCards.indexOf(card), 0);
  lastFocusedElement = document.activeElement;
  setLightboxContent(card);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  body.classList.add("lightbox-open");
  window.setTimeout(() => lightboxClose?.focus(), 100);
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
  if (!artCards.length) return;
  activeArtworkIndex = (activeArtworkIndex + direction + artCards.length) % artCards.length;
  setLightboxContent(artCards[activeArtworkIndex]);
};

artCards.forEach((card) => {
  card.addEventListener("pointerdown", () => {
    if (touchArtworkMode.matches) setMobileColorArtwork(card);
  });
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

window.addEventListener("scroll", requestScrollState, { passive: true });
window.addEventListener("resize", requestScrollState);
updateScrollState();

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const email = formData.get("email");
  const message = formData.get("message");
  const subject = encodeURIComponent("Art inquiry");
  const bodyText = encodeURIComponent(`Email: ${email}\n\n${message}`);

  if (formStatus) {
    formStatus.textContent = "Opening your email app with the inquiry ready to send.";
  }

  window.location.href = `mailto:pralisthamaharjan21@gmail.com?subject=${subject}&body=${bodyText}`;
});
