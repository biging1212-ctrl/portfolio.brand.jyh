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
  // Project artboards preserve the 1920x1080 Figma geometry on mobile.
  function updateWorkMobileScale() {
    document.documentElement.style.setProperty("--work-mobile-scale", String(window.innerWidth / DESIGN_WIDTH));
  }
  updateWorkMobileScale();
  window.addEventListener("resize", updateWorkMobileScale, {passive:true});
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
  document.querySelectorAll(".preview-image, .figma-image").forEach((image) => {
    function markMissing() {
      image.classList.add("is-missing");
      const section = image.closest(".work-page");
      if (section) section.setAttribute("data-missing-assets", "true");
    }
    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && !image.naturalWidth) markMissing();
  });

  // Pause long-running project motion while each page is off-screen.
  if ("IntersectionObserver" in window) {
    const workObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting);
      }
    }, { threshold: 0.12 });
    document.querySelectorAll(".work-page").forEach((section) => workObserver.observe(section));
  } else {
    document.querySelectorAll(".work-page").forEach((s) => s.classList.add("is-in-view"));
  }

  // Reduced-motion preferences are handled in CSS. Keep a live listener
  // for browsers that update this setting while the page is open.
  reducedMotion.addEventListener?.("change", () => {
    if (!categorySection) return;
    categorySection.classList.remove("is-in-view");
    requestAnimationFrame(() => categorySection.classList.add("is-in-view"));
  });
})();


/* Additional project scenes: start their motion only when scrolled into view. */
(() => {
  const scenes = [...document.querySelectorAll('.project-extra')];
  if ('IntersectionObserver' in window) {
    const viewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
    }, { threshold: .12 });
    scenes.forEach(scene => viewObserver.observe(scene));
  } else { scenes.forEach(scene => scene.classList.add('is-in-view')); }

  // On small phones, preserve the 1920:1080 Figma canvas and allow vertical browsing.
  function fitMobileCanvas() {
    if (window.innerWidth > 850) {
      document.documentElement.style.removeProperty('--extra-mobile-scale');
      return;
    }
    document.documentElement.style.setProperty('--extra-mobile-scale', String(window.innerWidth / 1920));
  }
  fitMobileCanvas();
  window.addEventListener('resize', fitMobileCanvas, { passive: true });

  // Missing asset files are hidden without broken-image indicators.
  scenes.forEach(scene => scene.querySelectorAll('img.figma-image').forEach(img => {
    const missing = () => img.classList.add('is-missing');
    img.addEventListener('error', missing, { once: true });
    if (img.complete && !img.naturalWidth) missing();
  }));
})();

/* Background media: play muted videos only while their page is visible. */
(() => {
  const scenes = Array.from(document.querySelectorAll('.portfolio-extension'));
  const videos = Array.from(document.querySelectorAll('.portfolio-extension video[data-portfolio-video]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mediaObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const vid = entry.target;
          if (!entry.isIntersecting || reduceMotion.matches) {
            vid.pause();
          } else {
            vid.play().catch(() => {}); // Some browsers restrict autoplay.
          }
        });
      }, { threshold: 0.10 }) : null;
  videos.forEach(v => {
    v.muted = true; v.playsInline = true;
    v.addEventListener('error', () => v.closest('.portfolio-extension')?.setAttribute('data-media-unavailable','true'));
    v.addEventListener('canplay', () => v.closest('.portfolio-extension')?.removeAttribute('data-media-unavailable'));
    if (mediaObserver) mediaObserver.observe(v);
  });
  scenes.forEach(section => {
    if (section.hasAttribute('data-media-only') || section.id === 'page-75') {
      section.querySelectorAll('.scene-media-cover:not(video)').forEach(img => {
        let formats = (img.dataset.fallbackFormats || '').split(',').filter(Boolean);
        img.addEventListener('error', () => {
          if (formats.length) {
            const next = formats.shift();
            img.src = img.src.replace(/\.[a-z0-9]+(?:\?.*)?$/i, '.'+next);
          } else section.setAttribute('data-media-unavailable', 'true');
        });
        img.addEventListener('load', () => section.removeAttribute('data-media-unavailable'));
      });
    }
  });
})();
