document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const splash = document.getElementById("splash");
  const video = document.getElementById("introVideo");
  const introLogo = document.getElementById("introLogo");
  const skipButton = document.getElementById("skipIntro");
  const brandLogo = document.querySelector(".brand img");
  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introLogoBounds = {
    x: 218,
    y: 332,
    width: 734,
    height: 204,
    sourceWidth: 1152,
    sourceHeight: 896
  };

  let introClosed = false;
  let fadeTimer = 0;
  let dockTimer = 0;
  let watchdogTimer = 0;

  const clearIntroTimers = () => {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(dockTimer);
    window.clearTimeout(watchdogTimer);
  };

  const updateDockTransform = () => {
    if (!splash || !introLogo || !brandLogo) {
      return;
    }

    const targetRect = brandLogo.getBoundingClientRect();
    if (targetRect.width < 1 || targetRect.height < 1) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fitScale = Math.max(
      viewportWidth / introLogoBounds.sourceWidth,
      viewportHeight / introLogoBounds.sourceHeight
    );
    const fittedWidth = introLogoBounds.sourceWidth * fitScale;
    const fittedHeight = introLogoBounds.sourceHeight * fitScale;
    const offsetX = (viewportWidth - fittedWidth) / 2;
    const offsetY = (viewportHeight - fittedHeight) / 2;

    const logoBoxX = offsetX + introLogoBounds.x * fitScale;
    const logoBoxY = offsetY + introLogoBounds.y * fitScale;
    const logoBoxWidth = introLogoBounds.width * fitScale;
    const logoBoxHeight = introLogoBounds.height * fitScale;

    const dockScale = targetRect.width / logoBoxWidth;
    const dockX = targetRect.left - logoBoxX * dockScale;
    const dockY =
      targetRect.top +
      targetRect.height / 2 -
      (logoBoxY + logoBoxHeight / 2) * dockScale;

    splash.style.setProperty("--dock-scale", dockScale.toFixed(6));
    splash.style.setProperty("--dock-x", `${dockX.toFixed(2)}px`);
    splash.style.setProperty("--dock-y", `${dockY.toFixed(2)}px`);
  };

  const completeIntro = () => {
    if (introClosed) {
      return;
    }

    introClosed = true;
    clearIntroTimers();

    splash.classList.add("phase-complete");
    body.classList.remove("intro-playing");
    body.classList.add("site-ready");

    window.setTimeout(() => {
      splash.style.display = "none";
    }, 700);
  };

  const dockLogo = () => {
    if (introClosed) {
      return;
    }

    updateDockTransform();
    splash.classList.add("phase-dock");
    dockTimer = window.setTimeout(completeIntro, 1300);
  };

  const transitionToLogo = () => {
    if (introClosed || splash.classList.contains("phase-image")) {
      return;
    }

    splash.classList.add("phase-image");

    if (video && !video.paused) {
      video.pause();
    }

    fadeTimer = window.setTimeout(dockLogo, 1000);
  };

  if (skipButton) {
    skipButton.addEventListener("click", transitionToLogo);
  }

  if (brandLogo) {
    if (brandLogo.complete) {
      updateDockTransform();
    } else {
      brandLogo.addEventListener("load", updateDockTransform, { once: true });
    }
  }

  window.addEventListener("resize", () => {
    if (introClosed) {
      return;
    }

    updateDockTransform();
  });

  if (prefersReducedMotion || !video) {
    splash.classList.add("phase-image", "phase-dock");
    completeIntro();
  } else {
    video.addEventListener("ended", transitionToLogo, { once: true });
    video.addEventListener("error", transitionToLogo, { once: true });

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        if (skipButton) {
          skipButton.classList.add("visible");
        }
      });
    }

    video.addEventListener(
      "playing",
      () => {
        if (skipButton) {
          skipButton.classList.add("visible");
        }
      },
      { once: true }
    );

    watchdogTimer = window.setTimeout(transitionToLogo, 15000);
  }

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  revealTargets.forEach((target, index) => {
    target.style.transitionDelay = `${index * 90}ms`;
    observer.observe(target);
  });
});
