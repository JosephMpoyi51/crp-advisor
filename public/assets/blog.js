(() => {
  if (typeof routes === "undefined") return;

  const sliderDefaultImages = {
    "comment-choisir-un-outil-ia": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
    "meilleurs-outils-ia-pour-pme": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    "chatgpt-claude-gemini-comparatif": "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1400&q=80",
    "outils-ia-pour-createurs": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1400&q=80",
    "automatiser-son-workflow-ia": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80"
  };

  const originalHome = routes["/"];
  routes["/"] = async function homeWithLatestArticles() {
    const html = await originalHome();
    return `${html}${await latestArticlesSlider()}`;
  };
  routes["/blog"] = blogIndexPage;

  const originalRender = render;
  render = async function blogAwareRender() {
    if (location.pathname.startsWith("/blog/")) {
      setActiveNav("/blog");
      document.querySelector("#app").innerHTML = await articlePage(location.pathname.split("/").pop());
      bindBlogInteractions();
      return;
    }
    await originalRender();
    bindBlogInteractions();
  };

  async function blogIndexPage() {
    const articles = await api("/api/articles");
    return `<section class="page blog-page"><p class="eyebrow">Blog</p><h1>Guides et comparatifs IA</h1><p class="lead">Analyses, conseils et méthodes pour choisir les bons outils IA.</p><div class="blog-list">${articles.map(articleCard).join("")}</div></section>`;
  }

  async function articlePage(slug) {
    const [article, allArticles, weeklyTools] = await Promise.all([
      api(`/api/articles/${slug}`),
      api("/api/articles"),
      api("/api/trending-tools?period=week&limit=4").catch(() => api("/api/tools/featured"))
    ]);
    const related = allArticles.filter((item) => item.slug !== article.slug).slice(0, 4);
    const url = `${location.origin}/blog/${article.slug}`;
    const title = encodeURIComponent(article.title);
    return `<article class="page article-page"><p class="eyebrow">${escapeHtml(article.category || "Guide")}</p><h1>${escapeHtml(article.title)}</h1><p class="lead">${escapeHtml(article.excerpt || "")}</p><div class="article-meta"><span class="author-chip"><span class="author-avatar">${escapeHtml(article.author_initials || initials(article.author))}</span>${escapeHtml(article.author || "CRP Advisor")}</span><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min de lecture</span></div><div class="share-row"><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${title}" target="_blank" rel="noopener">Twitter</a><a href="https://www.threads.net/intent/post?text=${title}%20${encodeURIComponent(url)}" target="_blank" rel="noopener">Threads</a><a href="mailto:?subject=${title}&body=${encodeURIComponent(url)}">Email</a><button type="button" data-copy-link="${escapeAttribute(url)}">Copier le lien</button></div><hr class="article-separator"><div class="article-content">${paragraphs(article.content).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}</div><hr class="article-separator"><section class="article-section"><h2>Articles similaires</h2><div class="related-grid">${related.map(relatedCard).join("")}</div></section><hr class="article-separator"><section class="article-section"><p class="eyebrow">Tendance cette semaine</p><h2>Outils en vedette</h2><div class="weekly-tools">${weeklyTools.slice(0, 4).map(weeklyToolCard).join("")}</div></section></article>`;
  }

  async function latestArticlesSlider() {
    const articles = (await api("/api/articles").catch(() => [])).slice(0, 4);
    if (!articles.length) return "";
    return `<section class="section latest-articles latest-articles-media"><div class="section-head"><p class="eyebrow">Derniers articles</p><h2>À lire sur CRP Advisor</h2></div><div class="latest-slider" data-latest-slider><div class="latest-track" style="--slides:${articles.length}">${articles.map(articleSlide).join("")}</div></div></section>`;
  }

  function bindBlogInteractions() {
    document.querySelectorAll("[data-copy-link]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "1";
      button.addEventListener("click", async () => {
        await navigator.clipboard?.writeText(button.dataset.copyLink).catch(() => null);
        button.textContent = "Lien copié";
      });
    });
  }

  function articleSlide(article) {
    return `<a class="latest-slide latest-slide-media" href="/blog/${article.slug}" data-link><img src="${escapeAttribute(articleImage(article))}" alt="" loading="lazy"><div class="latest-slide-body"><span class="tag">${escapeHtml(article.category || "Guide")}</span><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(articleExcerpt(article, 50))}</p><div class="article-meta"><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></div></a>`;
  }
  function articleCard(article) {
    return `<a class="blog-card" href="/blog/${article.slug}" data-link><span class="tag">${escapeHtml(article.category || "Guide")}</span><h2>${escapeHtml(article.title)}</h2><p>${escapeHtml(articleExcerpt(article, 50))}</p><div class="article-meta"><span>${escapeHtml(article.author || "CRP Advisor")}</span><span>${formatDate(article.published_at)}</span><span>${Number(article.reading_minutes || readingMinutes(article.content))} min</span></div></a>`;
  }
  function relatedCard(article) {
    return `<a class="related-card" href="/blog/${article.slug}" data-link><span class="tag">${escapeHtml(article.category || "Guide")}</span><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(articleExcerpt(article, 35))}</p></a>`;
  }
  function weeklyToolCard(tool) {
    const icon = tool.icon_url ? `<div class="logo"><img src="${escapeAttribute(tool.icon_url)}" alt="" loading="lazy" onerror="this.remove()"></div>` : `<div class="logo">${escapeHtml(tool.name?.[0] || "C")}</div>`;
    return `<a class="weekly-tool" href="/outil/${tool.slug}" data-link>${icon}<h3>${escapeHtml(tool.name)}</h3><p>${escapeHtml(tool.description || "")}</p><span class="tag">${tool.editorial_score || 0}/100</span></a>`;
  }
  function articleImage(article) { return article.featured_image_url || sliderDefaultImages[article.slug] || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80"; }
  function articleExcerpt(article, maxWords) { const text = `${article.excerpt || ""} ${article.content || ""}`.replace(/\s+/g, " ").trim(); const words = text.split(" ").filter(Boolean); return `${words.slice(0, maxWords).join(" ")}${words.length > maxWords ? "..." : ""}`; }
  function paragraphs(content) { return String(content || "").split(/\n{2,}/).filter(Boolean); }
  function readingMinutes(content) { return Math.max(1, Math.ceil(String(content || "").split(/\s+/).length / 220)); }
  function initials(name = "CRP Advisor") { return name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }
  function formatDate(value) { return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value || Date.now())); }
})();
