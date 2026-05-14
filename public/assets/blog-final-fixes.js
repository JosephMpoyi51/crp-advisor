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
  const stripTags = (value) => String(value || "").replace(/<[^>]*>/g, " ");
  const teaser = (article, limit = 60) => {
    const text = `${article.excerpt || ""} ${stripTags(article.content || "")}`.replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    return `${words.slice(0, limit).join(" ")}${words.length > limit ? "..." : ""}`;
  };
  const formatDate = (value) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value || Date.now()));
  const readingMinutes = (content) => Math.max(1, Math.ceil(stripTags(content || "").split(/\s+/).filter(Boolean).length / 220));

  async function getArticlesFull() {
    const list = await fetch("/api/articles", { credentials: "include" }).then((res) => res.json()).catch(() => []);
    return Promise.all(list.map(async (article) => {
      if (countWords(`${article.excerpt || ""} ${stripTags(article.content || "")}`) >= 60) return article;
      return fetch(`/api/articles/${article.slug}`, { credentials: "include" }).then((res) => res.ok ? res.json() : article).catch(() => article);
    }));
  }

  function slide(article) {
    return `<a class="latest-slide latest-slide-media" href="/blog/${article.slug}" data-link><img src="${attr(imageFor(article))}" alt="" loading="lazy"><div class="latest-slide-body"><span class="tag">${esc(article.category || "Guide")}</span><h3>${esc(article.title)}</h3><p>${esc(teaser(article, 60))}</p><div class="article-meta"><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></div></a>`;
  }

  function blogCard(article) {
    return `<a class="blog-card blog-card-media" href="/blog/${article.slug}" data-link><img src="${attr(imageFor(article))}" alt="" loading="lazy"><span class="tag">${esc(article.category || "Guide")}</span><h2>${esc(article.title)}</h2><p>${esc(teaser(article, 60))}</p><div class="article-meta"><span>${esc(article.author || "CRP Advisor")}</span><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></a>`;
  }

  function sanitizeRich(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    const allowed = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "STRONG", "EM", "B", "I", "A", "BLOCKQUOTE", "CODE", "PRE", "BR"]);
    template.content.querySelectorAll("*").forEach((node) => {
      if (!allowed.has(node.tagName)) { node.replaceWith(document.createTextNode(node.textContent || "")); return; }
      [...node.attributes].forEach((attribute) => {
        if (node.tagName === "A" && attribute.name === "href") return;
        node.removeAttribute(attribute.name);
      });
      if (node.tagName === "A") { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener"); }
    });
    return template.innerHTML;
  }

  function renderContent(content) {
    const raw = String(content || "").trim();
    if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeRich(raw);
    return raw.split(/\n{2,}/).filter(Boolean).map((text) => `<p>${esc(text)}</p>`).join("");
  }

  function relatedCard(article) {
    return `<a class="related-card related-card-media" href="/blog/${article.slug}" data-link><img src="${attr(imageFor(article))}" alt="" loading="lazy"><span class="tag">${esc(article.category || "Guide")}</span><h3>${esc(article.title)}</h3><p>${esc(teaser(article, 35))}</p></a>`;
  }

  function weeklyToolCard(tool) {
    const icon = tool.icon_url ? `<div class="logo"><img src="${attr(tool.icon_url)}" alt="" loading="lazy" onerror="this.remove()"></div>` : `<div class="logo">${esc(tool.name?.[0] || "C")}</div>`;
    return `<a class="weekly-tool" href="/outil/${tool.slug}" data-link>${icon}<h3>${esc(tool.name)}</h3><p>${esc(tool.description || "")}</p><span class="tag">${tool.editorial_score || 0}/100</span></a>`;
  }

  async function renderRichArticle(slug) {
    const [article, allArticles, weeklyTools] = await Promise.all([
      fetch(`/api/articles/${slug}`, { credentials: "include" }).then((res) => res.json()),
      getArticlesFull(),
      fetch("/api/trending-tools?period=week&limit=4", { credentials: "include" }).then((res) => res.json()).catch(() => [])
    ]);
    const related = allArticles.filter((item) => item.slug !== article.slug).slice(0, 4);
    const url = `${location.origin}/blog/${article.slug}`;
    const title = encodeURIComponent(article.title);
    document.querySelector("#app").innerHTML = `<article class="page article-page"><p class="eyebrow">${esc(article.category || "Guide")}</p><h1>${esc(article.title)}</h1><p class="lead">${esc(article.excerpt || "")}</p><figure class="article-hero-image"><img src="${attr(imageFor(article))}" alt="${attr(article.title)}" loading="lazy"></figure><div class="article-meta"><span class="author-chip"><span class="author-avatar">${esc(article.author_initials || "CA")}</span>${esc(article.author || "CRP Advisor")}</span><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min de lecture</span></div><div class="share-row"><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${title}" target="_blank" rel="noopener">Twitter</a><a href="https://www.threads.net/intent/post?text=${title}%20${encodeURIComponent(url)}" target="_blank" rel="noopener">Threads</a><a href="mailto:?subject=${title}&body=${encodeURIComponent(url)}">Email</a><button type="button" data-copy-link="${attr(url)}">Copier le lien</button></div><hr class="article-separator"><div class="article-content rich-article-content">${renderContent(article.content)}</div><hr class="article-separator"><section class="article-section"><h2>Articles similaires</h2><div class="related-grid">${related.map(relatedCard).join("")}</div></section><hr class="article-separator"><section class="article-section"><p class="eyebrow">Tendance cette semaine</p><h2>Outils en vedette</h2><div class="weekly-tools">${weeklyTools.slice(0, 4).map(weeklyToolCard).join("")}</div></section></article>`;
  }

  async function applyBlogFinalFixes() {
    if (location.pathname.startsWith("/blog/")) { await renderRichArticle(location.pathname.split("/").pop()); return; }
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
