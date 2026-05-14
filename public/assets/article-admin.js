(() => {
  if (typeof adminPage !== "function") return;

  adminPage = function articleAdminPage() {
    return `<section class="admin-login-only"><main class="admin-main" data-admin-main>${adminLogin()}</main></section>`;
  };

  const previousRenderAdminSection = renderAdminSection;
  renderAdminSection = async function articleAwareAdminSection(section = "dashboard") {
    if (section !== "articles") return previousRenderAdminSection(section);
    const main = document.querySelector("[data-admin-main]");
    if (!main) return;
    main.innerHTML = `<p class="notice">Chargement de l'éditeur d'articles...</p>`;
    try {
      const [articles, media] = await Promise.all([api("/api/admin/articles"), adminFetch("/api/admin/media")]);
      main.innerHTML = adminHeader("Articles") + articleEditor(media) + articleTable(articles);
      bindArticleEditor();
    } catch (error) {
      main.innerHTML = adminLogin() + `<p class="notice error">${escapeHtml(error.message)}</p>`;
      if (typeof bindAdminLogin === "function") bindAdminLogin();
    }
  };

  function articleEditor(media = []) {
    return `<section class="article-editor panel card"><div><h2>Créer ou modifier un article</h2><p>Ajoutez une image à la une depuis votre ordinateur ou sélectionnez une image déjà envoyée dans la médiathèque.</p></div><form class="article-form" data-article-form><div class="article-form-grid"><label>Titre<input name="title" placeholder="Titre de l'article" required></label><label>Slug<input name="slug" placeholder="mon-article"></label><label>Catégorie<input name="category" placeholder="Guide, Comparatif..."></label><label>Auteur<input name="author" placeholder="Joseph Mpoyi"></label><label>Date de publication<input name="published_at" type="date"></label><label>Minutes de lecture<input name="reading_minutes" type="number" min="1" value="5"></label></div><label>Extrait<textarea name="excerpt" placeholder="Résumé court affiché dans le blog" required></textarea></label><label>Contenu<textarea name="content" placeholder="Rédigez l'article. Séparez les paragraphes par une ligne vide." required></textarea></label><input name="featured_image_url" type="hidden" data-featured-image-url><div class="media-tools"><label class="upload-box">Téléverser une image<input type="file" accept="image/*" data-media-upload></label><div class="selected-media" data-selected-media>Aucune image sélectionnée</div></div><div class="media-library" data-media-library>${media.map(mediaItem).join("") || `<p class="notice">Aucune image dans la médiathèque.</p>`}</div><button class="btn" type="submit">Enregistrer l'article</button><div data-article-message></div></form></section>`;
  }

  function mediaItem(item) {
    return `<button class="media-item" type="button" data-media-url="${escapeAttribute(item.url)}"><img src="${escapeAttribute(item.url)}" alt="" loading="lazy"><span>${formatSize(item.size || 0)}</span></button>`;
  }

  function articleTable(articles) {
    return `<section class="article-admin-list"><h2>Articles existants</h2><div class="table-wrap"><table><thead><tr><th>Titre</th><th>Catégorie</th><th>Date</th><th>Image</th><th>Voir</th></tr></thead><tbody>${articles.map((article) => `<tr><td>${escapeHtml(article.title)}</td><td>${escapeHtml(article.category || "")}</td><td>${escapeHtml(article.published_at || "")}</td><td>${article.featured_image_url ? "Oui" : "Non"}</td><td><a href="/blog/${article.slug}" data-link>Ouvrir</a></td></tr>`).join("")}</tbody></table></div></section>`;
  }

  function bindArticleEditor() {
    const form = document.querySelector("[data-article-form]");
    const upload = document.querySelector("[data-media-upload]");
    const library = document.querySelector("[data-media-library]");
    const selected = document.querySelector("[data-selected-media]");
    const imageUrl = document.querySelector("[data-featured-image-url]");
    const message = document.querySelector("[data-article-message]");
    const setSelected = (url) => { imageUrl.value = url; selected.innerHTML = `<img src="${escapeAttribute(url)}" alt=""><span>Image sélectionnée</span>`; };

    library?.addEventListener("click", (event) => {
      const item = event.target.closest("[data-media-url]");
      if (!item) return;
      library.querySelectorAll(".media-item").forEach((button) => button.classList.remove("active"));
      item.classList.add("active");
      setSelected(item.dataset.mediaUrl);
    });

    upload?.addEventListener("change", async () => {
      const file = upload.files?.[0];
      if (!file) return;
      if (file.size > 60 * 1024 * 1024) { message.innerHTML = `<p class="notice error">Image trop lourde. Maximum 60 MB.</p>`; return; }
      const body = new FormData();
      body.append("image", file);
      const saved = await adminFetch("/api/admin/media", { method: "POST", body });
      setSelected(saved.url);
      library.insertAdjacentHTML("afterbegin", mediaItem(saved));
      message.innerHTML = `<p class="notice">Image ajoutée à la médiathèque.</p>`;
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      body.slug = body.slug || slugify(body.title);
      body.published_at = body.published_at || new Date().toISOString().slice(0, 10);
      body.author_initials = initials(body.author || "CRP Advisor");
      const saved = await api("/api/admin/articles", { method: "POST", body });
      message.innerHTML = `<p class="notice">Article enregistré : ${escapeHtml(saved.title)}</p>`;
      renderAdminSection("articles");
    });
  }

  async function adminFetch(url, options = {}) {
    const response = await fetch(url, { credentials: "include", ...options });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Erreur API"); }
    return response.json();
  }
  function slugify(value) { return String(value || "article").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180) || "article"; }
  function initials(name) { return String(name || "CRP Advisor").split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }
  function formatSize(size) { if (!size) return ""; return size > 1024 * 1024 ? `${Math.round(size / 1024 / 1024)} MB` : `${Math.round(size / 1024)} KB`; }
})();
