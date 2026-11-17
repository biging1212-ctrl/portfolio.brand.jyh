"use strict";

(() => {
  const DESIGN_WIDTH = 1920;
  const DESIGN_HEIGHT = 1080;
  const desktopQuery = window.matchMedia("(min-width: 851px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // The original Figma frames are 1920×1080. Scale the whole desktop
  // artboard uniformly; do not stretch typography or distort placements.
  function updateArtboardScale() {
    const scale = Math.min(
      window.innerWidth / DESIGN_WIDTH,
      window.innerHeight / DESIGN_HEIGHT
    );
    document.documentElement.style.setProperty(
      "--artboard-scale",
      String(desktopQuery.matches ? scale : 1)
    );
  }

  updateArtboardScale();
  window.addEventListener("resize", updateArtboardScale, { passive: true });
  desktopQuery.addEventListener?.("change", updateArtboardScale);

  // PAGE 02: Hover on desktop, click / keyboard / touch on all devices.
  const panels = [...document.querySelectorAll(".info-panel")];
  function closePanels(except = null) {
    panels.forEach((panel) => {
      if (panel === except) return;
      panel.classList.remove("is-open");
      panel.querySelector(".panel-bar")?.setAttribute("aria-expanded", "false");
    });
  }

  panels.forEach((panel) => {
    const button = panel.querySelector(".panel-bar");
    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !panel.classList.contains("is-open");
      closePanels(panel);
      panel.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
    // Desktop hover is handled by CSS. ARIA state remains synchronized.
    panel.addEventListener("mouseenter", () => {
      if (desktopQuery.matches) {
        button?.setAttribute("aria-expanded", "true");
      }
    });
    panel.addEventListener("mouseleave", () => {
      if (desktopQuery.matches && !panel.classList.contains("is-open")) {
        button?.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".info-panel")) closePanels();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanels();
      document.activeElement?.blur?.();
    }
  });

  // PAGE 03: Start the original 4-second motion when the section becomes
  // visible. Leaving the viewport removes the class, resetting its timeline.
  const categorySection = document.querySelector(".page-three");
  if (categorySection) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          categorySection.classList.toggle("is-in-view", entry.isIntersecting);
        },
        { threshold: 0.3 }
      );
      observer.observe(categorySection);
    } else {
      categorySection.classList.add("is-in-view");
    }
  }

  // Avoid displaying a browser's broken-image icon when a Figma asset
  // has not yet been exported to the local assets/ folder.
  document.querySelectorAll(".preview-image").forEach((image) => {
    function markMissing() { image.classList.add("is-missing"); }
    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && !image.naturalWidth) markMissing();
  });

  // Reduced-motion preferences are handled in CSS. Keep a live listener
  // for browsers that update this setting while the page is open.
  reducedMotion.addEventListener?.("change", () => {
    if (!categorySection) return;
    categorySection.classList.remove("is-in-view");
    requestAnimationFrame(() => categorySection.classList.add("is-in-view"));
  });
})();
