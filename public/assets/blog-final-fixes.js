(() => {
  const defaultImages = {
    "comment-choisir-un-outil-ia": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
    "meilleurs-outils-ia-pour-pme": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    "chatgpt-claude-gemini-comparatif": "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1400&q=80",
    "outils-ia-pour-createurs": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1400&q=80",
    "automatiser-son-workflow-ia": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80"
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const attr = (value) => esc(value).replace(/`/g, "&#096;");
  const imageFor = (article) => article.featured_image_url || defaultImages[article.slug] || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80";
  const countWords = (value) => String(value || "").trim().split(/\s+/).filter(Boolean).length;
  const teaser = (article, limit = 50) => {
    const text = `${article.excerpt || ""} ${article.content || ""}`.replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    return `${words.slice(0, limit).join(" ")}${words.length > limit ? "..." : ""}`;
  };
  const formatDate = (value) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value || Date.now()));
  const readingMinutes = (content) => Math.max(1, Math.ceil(String(content || "").split(/\s+/).filter(Boolean).length / 220));

  async function getArticlesFull() {
    const list = await fetch("/api/articles", { credentials: "include" }).then((res) => res.json()).catch(() => []);
    return Promise.all(list.map(async (article) => {
      if (countWords(`${article.excerpt || ""} ${article.content || ""}`) >= 50) return article;
      return fetch(`/api/articles/${article.slug}`, { credentials: "include" }).then((res) => res.ok ? res.json() : article).catch(() => article);
    }));
  }

  function slide(article) {
    return `<a class="latest-slide latest-slide-media" href="/blog/${article.slug}" data-link><img src="${attr(imageFor(article))}" alt="" loading="lazy"><div class="latest-slide-body"><span class="tag">${esc(article.category || "Guide")}</span><h3>${esc(article.title)}</h3><p>${esc(teaser(article, 50))}</p><div class="article-meta"><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></div></a>`;
  }

  function blogCard(article) {
    return `<a class="blog-card blog-card-media" href="/blog/${article.slug}" data-link><img src="${attr(imageFor(article))}" alt="" loading="lazy"><span class="tag">${esc(article.category || "Guide")}</span><h2>${esc(article.title)}</h2><p>${esc(teaser(article, 50))}</p><div class="article-meta"><span>${esc(article.author || "CRP Advisor")}</span><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></a>`;
  }

  async function applyBlogFinalFixes() {
    if (!["/", "/blog"].includes(location.pathname)) return;
    const articles = (await getArticlesFull()).slice(0, location.pathname === "/" ? 4 : 200);
    if (!articles.length) return;

    if (location.pathname === "/") {
      const current = document.querySelector(".latest-articles");
      const section = `<section class="section latest-articles latest-articles-media"><div class="section-head"><p class="eyebrow">Derniers articles</p><h2>À lire sur CRP Advisor</h2></div><div class="latest-slider" data-latest-slider><div class="latest-track" style="--slides:${articles.length}">${articles.map(slide).join("")}</div></div></section>`;
      if (current) current.outerHTML = section;
      else document.querySelector("#app")?.insertAdjacentHTML("beforeend", section);
    }

    if (location.pathname === "/blog") {
      const list = document.querySelector(".blog-list");
      if (list) list.innerHTML = articles.map(blogCard).join("");
    }
  }

  if (typeof render === "function") {
    const previousRender = render;
    render = async function renderWithFinalBlogFixes(...args) {
      const output = await previousRender.apply(this, args);
      applyBlogFinalFixes();
      return output;
    };
  }

  window.addEventListener("popstate", () => setTimeout(applyBlogFinalFixes, 80));
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-link]")) setTimeout(applyBlogFinalFixes, 180);
  });
  setTimeout(applyBlogFinalFixes, 700);
  setTimeout(applyBlogFinalFixes, 1600);
})();
