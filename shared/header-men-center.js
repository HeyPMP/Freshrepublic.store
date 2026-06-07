(function () {
  const TARGET_RATIO_KEY = "fr_nav_center_ratio_v2";
  let frameId = 0;
  let resizeObserver = null;
  let mutationObserver = null;
  let lastKnownTargetCenter = 0;

  function readStoredTargetRatio() {
    try {
      const rawValue = window.localStorage.getItem(TARGET_RATIO_KEY);
      const ratio = Number(rawValue);
      if (Number.isFinite(ratio) && ratio > 0 && ratio < 1) {
        return ratio;
      }
    } catch (error) {
      // Ignore unavailable storage.
    }

    return 0;
  }

  function storeTargetRatio(center) {
    if (!window.innerWidth || !Number.isFinite(center)) {
      return;
    }

    const ratio = center / window.innerWidth;
    if (!(ratio > 0 && ratio < 1)) {
      return;
    }

    try {
      window.localStorage.setItem(TARGET_RATIO_KEY, String(ratio));
    } catch (error) {
      // Ignore unavailable storage.
    }
  }

  function getElementCenter(element) {
    if (!element) {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return 0;
    }

    const styles = window.getComputedStyle(element);
    if (styles.display === "none" || styles.visibility === "hidden") {
      return 0;
    }

    return rect.left + rect.width / 2;
  }

  function resolveTargetCenter() {
    const anchor =
      document.querySelector("[data-nav-center-anchor]") ||
      document.querySelector('.category-btn[data-category="dresses"]');
    const anchorCenter = getElementCenter(anchor);
    if (anchorCenter) {
      lastKnownTargetCenter = anchorCenter;
      storeTargetRatio(anchorCenter);
      return anchorCenter;
    }

    const categoryRowCenter = getElementCenter(document.querySelector(".category-row"));
    if (categoryRowCenter) {
      lastKnownTargetCenter = categoryRowCenter;
      storeTargetRatio(categoryRowCenter);
      return categoryRowCenter;
    }

    const storedTargetRatio = readStoredTargetRatio();
    if (storedTargetRatio) {
      lastKnownTargetCenter = storedTargetRatio * window.innerWidth;
      return lastKnownTargetCenter;
    }

    if (lastKnownTargetCenter) {
      return lastKnownTargetCenter;
    }

    return window.innerWidth / 2;
  }

  function applyMenCentering() {
    frameId = 0;

    const header = document.querySelector(".header-static");
    const nav = header ? header.querySelector(".nav") : null;
    const menBtn = nav ? nav.querySelector("#menBtn") : null;

    if (!nav || !menBtn) {
      return;
    }

    nav.style.transform = "translateX(0px)";

    const menRect = menBtn.getBoundingClientRect();
    if (!menRect.width) {
      return;
    }

    const targetCenter = resolveTargetCenter();
    const menCenter = menRect.left + menRect.width / 2;
    const offset = Math.round(targetCenter - menCenter);

    nav.style.transform = "translateX(" + offset + "px)";
  }

  function requestMenCentering() {
    if (frameId) {
      return;
    }
    frameId = window.requestAnimationFrame(applyMenCentering);
  }

  function setupMenCentering() {
    requestMenCentering();
    window.setTimeout(requestMenCentering, 120);
    window.setTimeout(requestMenCentering, 360);
    window.setTimeout(requestMenCentering, 720);

    window.addEventListener("resize", requestMenCentering, { passive: true });
    window.addEventListener("orientationchange", requestMenCentering);
    window.addEventListener("load", requestMenCentering);
    window.addEventListener("pageshow", requestMenCentering);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestMenCentering).catch(function () {
        requestMenCentering();
      });
    }

    const header = document.querySelector(".header-static");
    const nav = document.querySelector(".header-static .nav");
    const categoryRow = document.querySelector(".category-row");
    const centerAnchor =
      document.querySelector("[data-nav-center-anchor]") ||
      document.querySelector('.category-btn[data-category="dresses"]');
    const homeBtn = document.getElementById("homeBtn");
    const menBtn = document.getElementById("menBtn");
    const womenBtn = document.getElementById("womenBtn");

    [homeBtn, menBtn, womenBtn].forEach(function (button) {
      if (button) {
        button.addEventListener("click", requestMenCentering);
      }
    });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(requestMenCentering);
      [header, nav, categoryRow, centerAnchor].forEach(function (element) {
        if (element) {
          resizeObserver.observe(element);
        }
      });
    }

    if (categoryRow && typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(requestMenCentering);
      mutationObserver.observe(categoryRow, {
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "aria-hidden"],
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMenCentering, { once: true });
  } else {
    setupMenCentering();
  }
}());
