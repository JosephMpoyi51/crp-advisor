(() => {
  const ignoredUrls = ["/api/analytics/view", "/api/newsletter"];
  let activeCount = 0;
  let hideTimer;

  function ensureLoader() {
    let loader = document.querySelector("[data-page-loader]");
    if (loader) return loader;
    loader = document.createElement("div");
    loader.className = "page-loader";
    loader.setAttribute("data-page-loader", "");
    loader.innerHTML = `<div class="page-loader-card"><div class="page-loader-spinner" aria-hidden="true"></div><strong>Chargement...</strong></div>`;
    document.body.appendChild(loader);
    return loader;
  }

  function show() {
    clearTimeout(hideTimer);
    ensureLoader().classList.add("visible");
  }

  function hideSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeCount > 0) return;
      document.querySelector("[data-page-loader]")?.classList.remove("visible");
    }, 160);
  }

  window.CRPPageLoader = { show, hide: hideSoon };

  if (typeof render === "function") {
    const originalRender = render;
    render = async function loadingRender(...args) {
      show();
      try {
        return await originalRender.apply(this, args);
      } finally {
        hideSoon();
      }
    };
  }

  if (typeof api === "function") {
    const originalApi = api;
    api = async function loadingApi(url, options = {}) {
      const shouldShow = !ignoredUrls.some((item) => String(url).includes(item));
      if (shouldShow) {
        activeCount += 1;
        show();
      }
      try {
        return await originalApi(url, options);
      } finally {
        if (shouldShow) {
          activeCount = Math.max(0, activeCount - 1);
          hideSoon();
        }
      }
    };
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-link]");
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname !== location.pathname) show();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.closest("form")) show();
  });

  show();
  window.addEventListener("load", hideSoon);
  setTimeout(hideSoon, 2500);
})();
