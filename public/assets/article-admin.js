(() => {
  if (typeof adminPage !== "function") return;

  let tiptapEditor = null;
  let currentArticles = [];

  adminPage = function articleAdminPage() {
    return `<section class="admin-login-only"><main class="admin-main" data-admin-main>${adminLogin()}</main></section>`;
  };

  bindAdminLogin = function bindPolishedAdminLogin() {
    document.querySelector(".admin-login")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api("/api/admin/login", { method: "POST", body: Object.fromEntries(new FormData(event.target)) });
        document.querySelector("#app").innerHTML = adminShell();
        bindAdmin();
        renderAdminSection("dashboard");
      } catch (error) {
        document.querySelector("[data-admin-message]").innerHTML = `<p class="notice error">${escapeHtml(error.message)}</p>`;
      }
    });
  };

  const previousRenderAdminSection = renderAdminSection;
  renderAdminSection = async function articleAwareAdminSection(section = "dashboard") {
    if (section !== "articles") return previousRenderAdminSection(section);
    const main = ensureAdminShell();
    main.innerHTML = `<p class="notice">Chargement de l'éditeur d'articles...</p>`;
    try {
      const [articles, media] = await Promise.all([api("/api/admin/articles"), adminFetch("/api/admin/media")]);
      currentArticles = articles;
      main.innerHTML = adminHeader("Articles") + articleEditor(media) + articleTable(articles);
      await bindArticleEditor();
    } catch (error) {
      main.innerHTML = `<p class="notice error">${escapeHtml(error.message)}</p>`;
    }
  };

  function adminShell() {
    return `<section class="admin-layout admin-authenticated"><aside class="admin-side"><a href="#" data-admin-section="dashboard">Tableau de bord</a><a href="#" data-admin-section="tools">Outils</a><a href="#" data-admin-section="articles">Articles</a><a href="#" data-admin-section="leads">Leads</a><a href="#" data-admin-section="reviews">Avis</a><a href="#" data-admin-section="messages">Messages</a><button class="btn ghost admin-logout" type="button" data-admin-logout>Déconnexion</button></aside><main class="admin-main" data-admin-main></main></section>`;
  }

  function ensureAdminShell() {
    let main = document.querySelector("[data-admin-main]");
    if (!main || document.querySelector(".admin-login-card")) {
      document.querySelector("#app").innerHTML = adminShell();
      bindAdmin();
      main = document.querySelector("[data-admin-main]");
    }
    return main;
  }

  function articleEditor(media = []) {
    return `<section class="article-editor panel card"><div class="article-editor-head"><div><h2 data-editor-title>Créer un article</h2><p>Rédigez, enrichissez le contenu avec Tiptap, choisissez une image à la une puis publiez la mise à jour sur le front.</p></div><button class="btn ghost" type="button" data-new-article>Nouvel article</button></div><form class="article-form" data-article-form><div class="article-form-grid"><label>Titre<input name="title" placeholder="Titre de l'article" required></label><label>Slug<input name="slug" placeholder="mon-article"></label><label>Catégorie<input name="category" placeholder="Guide, Comparatif..."></label><label>Auteur<input name="author" placeholder="Joseph Mpoyi"></label><label>Date de publication<input name="published_at" type="date"></label><label>Minutes de lecture<input name="reading_minutes" type="number" min="1" value="5"></label></div><label>Extrait<textarea name="excerpt" placeholder="Résumé court affiché dans le blog" required></textarea></label><input name="content" type="hidden" data-article-content><div class="rich-editor-wrap"><div class="editor-toolbar" data-editor-toolbar><button type="button" data-editor-command="toggleBold">B</button><button type="button" data-editor-command="toggleItalic">I</button><button type="button" data-editor-command="toggleHeading">H2</button><button type="button" data-editor-command="toggleBulletList">Liste</button><button type="button" data-editor-command="toggleOrderedList">1.</button><button type="button" data-editor-command="toggleBlockquote">Citation</button></div><div class="tiptap-editor" data-tiptap-editor></div></div><input name="featured_image_url" type="hidden" data-featured-image-url><div class="media-tools"><label class="upload-box">Téléverser une image<input type="file" accept="image/*" data-media-upload></label><div class="selected-media" data-selected-media>Aucune image sélectionnée</div></div><div class="media-library" data-media-library>${media.map(mediaItem).join("") || `<p class="notice">Aucune image dans la médiathèque.</p>`}</div><button class="btn" type="submit">Enregistrer l'article</button><div data-article-message></div></form></section>`;
  }

  function mediaItem(item) {
    return `<button class="media-item" type="button" data-media-url="${escapeAttribute(item.url)}"><img src="${escapeAttribute(item.url)}" alt="" loading="lazy"><span>${formatSize(item.size || 0)}</span></button>`;
  }

  function articleTable(articles) {
    return `<section class="article-admin-list"><h2>Articles existants</h2><div class="table-wrap"><table><thead><tr><th>Titre</th><th>Catégorie</th><th>Date</th><th>Image</th><th>Actions</th></tr></thead><tbody>${articles.map((article) => `<tr><td>${escapeHtml(article.title)}</td><td>${escapeHtml(article.category || "")}</td><td>${escapeHtml(article.published_at || "")}</td><td>${article.featured_image_url ? "Oui" : "Non"}</td><td><div class="admin-row-actions"><button class="btn ghost" type="button" data-edit-article="${escapeAttribute(article.slug)}">Modifier</button><a class="btn ghost" href="/blog/${article.slug}" data-link>Ouvrir</a></div></td></tr>`).join("")}</tbody></table></div></section>`;
  }

  async function bindArticleEditor() {
    const form = document.querySelector("[data-article-form]");
    const upload = document.querySelector("[data-media-upload]");
    const library = document.querySelector("[data-media-library]");
    const selected = document.querySelector("[data-selected-media]");
    const imageUrl = document.querySelector("[data-featured-image-url]");
    const contentInput = document.querySelector("[data-article-content]");
    const message = document.querySelector("[data-article-message]");
    const title = document.querySelector("[data-editor-title]");
    const setSelected = (url) => { imageUrl.value = url; selected.innerHTML = `<img src="${escapeAttribute(url)}" alt=""><span>Image sélectionnée</span>`; };

    tiptapEditor = await createTiptapEditor(document.querySelector("[data-tiptap-editor]"));

    document.querySelector("[data-new-article]")?.addEventListener("click", () => {
      form.reset();
      contentInput.value = "";
      imageUrl.value = "";
      selected.textContent = "Aucune image sélectionnée";
      title.textContent = "Créer un article";
      tiptapEditor?.commands.setContent("");
      document.querySelectorAll(".media-item").forEach((button) => button.classList.remove("active"));
    });

    document.querySelector(".article-admin-list")?.addEventListener("click", async (event) => {
      const edit = event.target.closest("[data-edit-article]");
      if (!edit) return;
      const article = await adminFetch(`/api/articles/${edit.dataset.editArticle}`);
      fillArticleForm(article, setSelected);
      title.textContent = `Modifier : ${article.title}`;
      document.querySelector(".article-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.querySelector("[data-editor-toolbar]")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-editor-command]");
      if (!button || !tiptapEditor) return;
      const chain = tiptapEditor.chain().focus();
      const command = button.dataset.editorCommand;
      if (command === "toggleBold") chain.toggleBold().run();
      if (command === "toggleItalic") chain.toggleItalic().run();
      if (command === "toggleHeading") chain.toggleHeading({ level: 2 }).run();
      if (command === "toggleBulletList") chain.toggleBulletList().run();
      if (command === "toggleOrderedList") chain.toggleOrderedList().run();
      if (command === "toggleBlockquote") chain.toggleBlockquote().run();
    });

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
      contentInput.value = tiptapEditor ? tiptapEditor.getHTML() : contentInput.value;
      const body = Object.fromEntries(new FormData(form));
      body.slug = body.slug || slugify(body.title);
      body.published_at = body.published_at || new Date().toISOString().slice(0, 10);
      body.author_initials = initials(body.author || "CRP Advisor");
      const saved = await api("/api/admin/articles", { method: "POST", body });
      message.innerHTML = `<p class="notice">Article enregistré : ${escapeHtml(saved.title)}</p>`;
      renderAdminSection("articles");
    });
  }

  function fillArticleForm(article, setSelected) {
    const form = document.querySelector("[data-article-form]");
    form.title.value = article.title || "";
    form.slug.value = article.slug || "";
    form.category.value = article.category || "";
    form.author.value = article.author || "";
    form.published_at.value = String(article.published_at || "").slice(0, 10);
    form.reading_minutes.value = article.reading_minutes || 5;
    form.excerpt.value = article.excerpt || "";
    document.querySelector("[data-article-content]").value = article.content || "";
    tiptapEditor?.commands.setContent(article.content || "");
    if (article.featured_image_url) setSelected(article.featured_image_url);
  }

  async function createTiptapEditor(element) {
    try {
      const [{ Editor }, starter] = await Promise.all([
        import("https://esm.sh/@tiptap/core@2.11.7"),
        import("https://esm.sh/@tiptap/starter-kit@2.11.7")
      ]);
      return new Editor({ element, extensions: [starter.default], content: "" });
    } catch {
      element.innerHTML = `<div contenteditable="true" class="tiptap-fallback"></div>`;
      return { getHTML: () => element.querySelector(".tiptap-fallback")?.innerHTML || "", commands: { setContent: (html) => { element.querySelector(".tiptap-fallback").innerHTML = html || ""; } }, chain: () => ({ focus: () => ({ toggleBold: () => ({ run() {} }), toggleItalic: () => ({ run() {} }), toggleHeading: () => ({ run() {} }), toggleBulletList: () => ({ run() {} }), toggleOrderedList: () => ({ run() {} }), toggleBlockquote: () => ({ run() {} }) }) }) } };
    }
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
