(() => {
  const ignoredUrls = ["/api/analytics/view", "/api/newsletter"];
  const labels = [
    { match: "/api/recommendations", text: "Préparation de vos recommandations..." },
    { match: "/api/tools", text: "Chargement des outils IA..." },
    { match: "/api/categories", text: "Chargement des catégories..." },
    { match: "/api/articles", text: "Chargement des articles..." },
    { match: "/api/admin", text: "Ouverture de l'espace admin..." }
  ];
  let activeCount = 0;
  let hideTimer;

  function ensureLoader() {
    let loader = document.querySelector("[data-page-loader]");
    if (loader) return loader;
    loader = document.createElement("div");
    loader.className = "page-loader";
    loader.setAttribute("data-page-loader", "");
    loader.innerHTML = `<div class="page-loader-card"><div class="page-loader-spinner" aria-hidden="true"></div><strong data-loader-title>Chargement...</strong><span>CRP Advisor prépare la page.</span></div>`;
    document.body.appendChild(loader);
    return loader;
  }

  function labelFor(url) {
    return labels.find((item) => String(url).includes(item.match))?.text || "Chargement de la page...";
  }

  function show(text = "Chargement de la page...") {
    clearTimeout(hideTimer);
    const loader = ensureLoader();
    const title = loader.querySelector("[data-loader-title]");
    if (title) title.textContent = text;
    loader.classList.add("visible");
  }

  function hideSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeCount > 0) return;
      document.querySelector("[data-page-loader]")?.classList.remove("visible");
    }, 180);
  }

  window.CRPPageLoader = { show, hide: hideSoon };

  if (typeof render === "function") {
    const originalRender = render;
    render = async function loadingRender(...args) {
      show("Chargement de la page...");
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
        show(labelFor(url));
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
    if (url.origin === location.origin && url.pathname !== location.pathname) show("Chargement de la page...");
  });

  document.addEventListener("submit", (event) => {
    if (event.target.closest(".admin-login")) show("Connexion en cours...");
    if (event.target.closest(".contact-form")) show("Envoi du message...");
    if (event.target.closest(".review-form")) show("Envoi de votre avis...");
  });

  show("Chargement de CRP Advisor...");
  window.addEventListener("load", hideSoon);
  setTimeout(hideSoon, 3500);
})();
