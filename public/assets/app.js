const state = { categories: [], tools: [], answers: {} };
const routes = {
  "/": home,
  "/outils": toolsPage,
  "/questionnaire": questionnairePage,
  "/resultats": resultsPage,
  "/comparer": comparePage,
  "/deals": dealsPage,
  "/blog": blogPage,
  "/contact": contactPage,
  "/proposer-outil": suggestToolPage,
  "/admin": adminPage
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  history.pushState({}, "", url.pathname);
  render();
});

document.querySelector("[data-menu-toggle]")?.addEventListener("click", () => {
  document.querySelector("[data-nav]")?.classList.toggle("open");
});
window.addEventListener("popstate", render);
document.querySelector("[data-newsletter]")?.addEventListener("submit", newsletterSubmit);

async function boot() {
  const [categories, tools] = await Promise.all([api("/api/categories"), api("/api/tools")]);
  state.categories = categories;
  state.tools = tools;
  render();
  api("/api/analytics/view", { method: "POST", body: { path: location.pathname, source: document.referrer, device_type: innerWidth < 760 ? "mobile" : "desktop" } }).catch(() => null);
}

async function render() {
  const path = location.pathname;
  const route = path.startsWith("/outil/") ? toolDetailPage : path.startsWith("/alternatives/") ? alternativesPage : routes[path] || notFoundPage;
  setActiveNav(path);
  document.querySelector("#app").innerHTML = await route(path);
  bindPage(path);
}

function setActiveNav(path) {
  document.querySelectorAll(".nav a").forEach((link) => link.classList.toggle("active", new URL(link.href).pathname === path));
}

function home() {
  const featured = [...state.tools].sort((a, b) => b.editorial_score - a.editorial_score).slice(0, 6);
  return `<section class="hero"><div><p class="eyebrow">Comparateur IA indépendant</p><h1>Trouvez l'outil IA vraiment adapté à votre besoin</h1><p class="lead">Répondez à 6 questions, comparez les meilleures solutions et gagnez du temps dans le choix de vos outils IA.</p><div class="actions"><a class="btn" href="/questionnaire" data-link>Lancer le questionnaire</a><a class="btn ghost" href="/outils" data-link>Explorer les outils</a></div><div class="metrics"><div class="metric"><strong>${state.categories.length}+</strong><span>catégories IA</span></div><div class="metric"><strong>100</strong><span>score maximum</span></div><div class="metric"><strong>6</strong><span>étapes de diagnostic</span></div></div></div><aside class="hero-panel"><div class="score-preview"><p class="eyebrow">Recommandation instantanée</p><h2>${featured[0]?.name || "ChatGPT"}</h2><div class="score-circle"><strong>${featured[0]?.editorial_score || 92}</strong></div><div class="bars"><span><i style="--w:92%"></i></span><span><i style="--w:84%"></i></span><span><i style="--w:76%"></i></span></div><p>Besoin, budget, niveau, priorité, API et support français sont pris en compte.</p></div></aside></section><section class="section"><div class="section-head"><p class="eyebrow">Sélection</p><h2>Outils IA recommandés</h2></div><div class="grid tools">${featured.map(toolCard).join("")}</div></section><section class="section"><div class="section-head"><p class="eyebrow">Catégories</p><h2>Explorez par besoin</h2></div><div class="grid categories">${state.categories.map(categoryCard).join("")}</div></section><section class="section"><div class="flow"><article><strong>1</strong><span>Décrivez votre besoin</span></article><article><strong>2</strong><span>Affinez budget et priorité</span></article><article><strong>3</strong><span>Recevez votre top 3</span></article></div></section>`;
}

function toolsPage() {
  return `<section class="page"><p class="eyebrow">Annuaire IA</p><h1>Tous les outils IA</h1><p class="lead">Filtrez les solutions par catégorie, budget, API et support français.</p><div class="filters"><input data-filter-search placeholder="Rechercher un outil"><select data-filter-category><option value="">Toutes les catégories</option>${state.categories.map((c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join("")}</select><select data-filter-budget><option value="">Tous les budgets</option><option value="free">Gratuit</option><option value="paid">Payant</option></select></div><div class="grid tools" data-tools-list>${state.tools.map(toolCard).join("")}</div></section>`;
}

function toolDetailPage(path) {
  const slug = path.split("/").pop();
  const tool = state.tools.find((item) => item.slug === slug);
  if (!tool) return notFoundPage();
  const alternatives = state.tools.filter((item) => (tool.alternatives || []).includes(item.slug)).slice(0, 3);
  return `<section class="page"><p class="eyebrow">${escapeHtml(tool.category)}</p><h1>${escapeHtml(tool.name)}</h1><p class="lead">${escapeHtml(tool.description)}</p><div class="actions"><a class="btn" href="${escapeAttribute(tool.affiliate_url || "#")}" target="_blank" rel="nofollow noopener">Visiter le site</a><a class="btn ghost" href="/questionnaire" data-link>Comparer avec mon besoin</a></div><div class="grid two section"><article class="panel card">${infoList("Avantages", tool.advantages)}</article><article class="panel card">${infoList("Limites", tool.limits)}</article></div><div class="grid two"><article class="panel card"><h2>Profil idéal</h2><p>${escapeHtml(tool.ideal_profile || "")}</p>${tags(tool.use_cases)}</article><article class="panel card"><h2>Score éditorial</h2><div class="score-circle"><strong>${tool.editorial_score}</strong></div><p>Prix: ${escapeHtml(tool.price_label)} | API: ${tool.api_available ? "Oui" : "Non"} | Français: ${tool.french_support ? "Oui" : "Non"}</p></article></div><section class="section"><h2>Alternatives</h2><div class="grid tools">${alternatives.map(toolCard).join("")}</div></section></section>`;
}

function questionnairePage() {
  return `<section class="question-shell"><div class="progress-wrap"><div class="question-bar"><strong data-step-label>Étape 1 sur 6</strong><div class="progress"><span data-progress style="width:16.6%"></span></div></div></div><div class="question-stage" data-question-stage></div><div class="question-footer"><div class="question-nav"><button class="btn ghost" data-prev>Retour</button><button class="btn" data-next disabled>Suivant</button></div></div></section>`;
}

function resultsPage() {
  const raw = localStorage.getItem("crp_answers");
  if (!raw) return `<section class="page"><p class="eyebrow">Résultats</p><h1>Aucun questionnaire trouvé</h1><p>Commencez par répondre aux 6 questions.</p><a class="btn" href="/questionnaire" data-link>Lancer le questionnaire</a></section>`;
  const answers = JSON.parse(raw);
  const results = scoreTools(state.tools, answers).slice(0, 3);
  return `<section class="page"><p class="eyebrow">Recommandations</p><h1>Votre top 3 outils IA</h1><p class="lead">Classement personnalisé selon vos réponses.</p>${results.map(resultCard).join("")}<div class="actions"><a class="btn ghost" href="/questionnaire" data-link>Reprendre le questionnaire</a><button class="btn subtle" data-save-lead>Recevoir ces résultats par email</button></div></section>`;
}

function comparePage() {
  return `<section class="page"><p class="eyebrow">Comparateur</p><h1>Comparer les outils IA</h1><div class="table-wrap"><table><thead><tr><th>Outil</th><th>Catégorie</th><th>Prix</th><th>API</th><th>Français</th><th>Score</th></tr></thead><tbody>${state.tools.map((t) => `<tr><td><a href="/outil/${t.slug}" data-link>${escapeHtml(t.name)}</a></td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.price_label)}</td><td>${t.api_available ? "Oui" : "Non"}</td><td>${t.french_support ? "Oui" : "Non"}</td><td>${t.editorial_score}/100</td></tr>`).join("")}</tbody></table></div></section>`;
}

function alternativesPage(path) {
  const slug = path.split("/").pop();
  const tool = state.tools.find((item) => item.slug === slug);
  const alternatives = tool ? state.tools.filter((item) => (tool.alternatives || []).includes(item.slug)) : [];
  return `<section class="page"><p class="eyebrow">Alternatives</p><h1>Alternatives à ${escapeHtml(tool?.name || slug)}</h1><div class="grid tools">${alternatives.map(toolCard).join("")}</div></section>`;
}

function dealsPage() {
  return `<section class="page"><p class="eyebrow">Deals</p><h1>Codes promo IA</h1><p class="lead">Module prêt : les codes promo seront gérés depuis l'admin.</p><div class="grid two"><article class="card panel"><h2>Offres partenaires</h2><p>Ajoutez les deals dans la base MySQL via le tableau de bord admin.</p></article><article class="card panel"><h2>Affiliation</h2><p>Chaque outil peut recevoir un lien affilié.</p></article></div></section>`;
}

async function blogPage() {
  const articles = await api("/api/articles");
  return `<section class="page"><p class="eyebrow">Blog</p><h1>Guides et comparatifs IA</h1><div class="grid two">${articles.map((a) => `<article class="card panel"><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.excerpt || "")}</p></article>`).join("")}</div></section>`;
}

function contactPage() {
  return formPage("Contact", "Envoyez un message à l'équipe CRP Advisor.", "contact-form", [["name", "Votre nom"], ["email", "Email"], ["subject", "Sujet"], ["message", "Message", "textarea"]]);
}

function suggestToolPage() {
  return formPage("Proposer un outil", "Soumettez un outil IA à ajouter dans l'annuaire.", "suggest-form", [["tool_name", "Nom de l'outil"], ["website", "Site web"], ["category", "Catégorie"], ["submitter_name", "Votre nom"], ["submitter_email", "Email"], ["message", "Message", "textarea"]]);
}

function formPage(title, intro, formClass, fields) {
  return `<section class="page"><p class="eyebrow">CRP Advisor</p><h1>${title}</h1><p class="lead">${intro}</p><form class="form-grid ${formClass}">${fields.map(([name, label, type]) => type === "textarea" ? `<textarea name="${name}" placeholder="${label}" required></textarea>` : `<input name="${name}" placeholder="${label}" ${name.includes("email") ? "type='email'" : ""} required>`).join("")}<button class="btn" type="submit">Envoyer</button></form><div data-form-message></div></section>`;
}

function adminPage() {
  return `<section class="admin-layout"><aside class="admin-side"><a href="#" data-admin-section="dashboard">Tableau de bord</a><a href="#" data-admin-section="tools">Outils</a><a href="#" data-admin-section="leads">Leads</a><a href="#" data-admin-section="reviews">Avis</a><a href="#" data-admin-section="messages">Messages</a><button class="btn ghost admin-logout" type="button" data-admin-logout>Déconnexion</button></aside><main class="admin-main" data-admin-main>${adminLogin()}</main></section>`;
}

function adminLogin() {
  return `<h1>Admin CRP Advisor</h1><p>Connectez-vous pour gérer les outils, leads, avis et messages.</p><form class="form-grid admin-login"><input name="email" type="email" placeholder="Email admin" required><input name="password" type="password" placeholder="Mot de passe" required><button class="btn">Connexion</button></form><div data-admin-message></div>`;
}

async function renderAdminSection(section = "dashboard") {
  const main = document.querySelector("[data-admin-main]");
  if (!main) return;
  main.innerHTML = `<p class="notice">Chargement de l'espace admin...</p>`;
  try {
    if (section === "dashboard") {
      const stats = await api("/api/admin/stats");
      main.innerHTML = adminHeader("Tableau de bord") + `<div class="admin-grid">${Object.entries(stats).map(([k, v]) => `<article class="stat"><span>${adminLabel(k)}</span><strong>${v}</strong></article>`).join("")}</div>`;
    }
    if (section === "tools") {
      const rows = await api("/api/admin/tools");
      main.innerHTML = adminHeader("Outils IA") + `<p>${rows.length} outils gérés.</p><div class="table-wrap">${table(rows, ["name", "category", "price_label", "editorial_score"])}</div>`;
    }
    if (section === "leads") main.innerHTML = adminHeader("Leads") + `<div class="table-wrap">${table(await api("/api/admin/leads"), ["first_name", "email", "created_at"])}</div>`;
    if (section === "reviews") main.innerHTML = adminHeader("Avis") + `<div class="table-wrap">${table(await api("/api/admin/reviews"), ["tool_slug", "first_name", "rating", "approved"])}</div>`;
    if (section === "messages") main.innerHTML = adminHeader("Messages") + `<div class="table-wrap">${table(await api("/api/admin/contact_messages"), ["name", "email", "subject", "handled"])}</div>`;
  } catch (error) {
    const message = error.status === 401 ? "Accès admin requis. Connectez-vous pour ouvrir le tableau de bord." : error.message;
    main.innerHTML = adminLogin() + `<p class="notice error">${escapeHtml(message)}</p>`;
    bindAdminLogin();
  }
}

function adminHeader(title) {
  return `<div class="admin-top"><h1>${escapeHtml(title)}</h1><button class="btn ghost" type="button" data-admin-logout>Déconnexion</button></div>`;
}
function adminLabel(key) {
  return ({ tools: "Outils", categories: "Catégories", leads: "Leads", reviews: "Avis", messages: "Messages", suggestions: "Suggestions", newsletter: "Newsletter", views: "Vues" })[key] || key;
}
function table(rows, keys) {
  return `<table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${keys.map((k) => `<td>${escapeHtml(row[k] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function bindPage(path) {
  if (path === "/questionnaire") bindQuestionnaire();
  if (path === "/outils") bindFilters();
  if (path === "/admin") bindAdmin();
  document.querySelector(".contact-form")?.addEventListener("submit", submitContact);
  document.querySelector(".suggest-form")?.addEventListener("submit", submitSuggestion);
  document.querySelector("[data-save-lead]")?.addEventListener("click", saveLeadPrompt);
}

function bindQuestionnaire() {
  const questions = [
    { key: "besoin", title: "Quel est votre besoin principal ?", intro: "Choisissez la famille d'outils la plus proche de votre objectif.", options: state.categories.map((c) => ({ id: c.slug, label: c.name, desc: c.description })) },
    { key: "budget", title: "Quel est votre budget mensuel ?", intro: "Le prix compte dans la recommandation finale.", options: [["gratuit", "Gratuit", "Solution gratuite ou freemium"], ["petit", "Petit budget", "Moins de 15 euros/mois"], ["moyen", "Budget moyen", "Moins de 40 euros/mois"], ["eleve", "Budget élevé", "Priorité à la valeur"]].map(optionFromArray) },
    { key: "niveau", title: "Quel est votre niveau technique ?", intro: "Pour éviter un outil trop complexe.", options: [["debutant", "Débutant", "Simple et prêt à utiliser"], ["intermediaire", "Intermédiaire", "Vous utilisez déjà l'IA"], ["avance", "Avancé", "API, workflows, intégrations"]].map(optionFromArray) },
    { key: "priorite", title: "Quelle est votre priorité ?", intro: "Ce critère affine les outils qui sortent du lot.", options: [["simplicite", "Simplicité", "Interface claire"], ["qualite", "Qualité", "Meilleur résultat"], ["integration", "Intégrations", "Workflow connecté"], ["confidentialite", "Confidentialité", "Données mieux maîtrisées"]].map(optionFromArray) },
    { key: "apiRequise", title: "Avez-vous besoin d'une API ?", intro: "Utile pour connecter l'outil à un site ou CRM.", options: [{ id: true, label: "Oui", desc: "Indispensable" }, { id: false, label: "Non", desc: "Pas nécessaire" }] },
    { key: "francaisRequis", title: "Le français est-il nécessaire ?", intro: "Interface, support ou résultats en français.", options: [{ id: true, label: "Oui", desc: "Le français est essentiel" }, { id: false, label: "Non", desc: "L'anglais me convient" }] }
  ];
  let step = 0;
  const answers = {};
  const stage = document.querySelector("[data-question-stage]");
  const next = document.querySelector("[data-next]");
  const prev = document.querySelector("[data-prev]");
  const label = document.querySelector("[data-step-label]");
  const progress = document.querySelector("[data-progress]");
  function draw() {
    const q = questions[step];
    label.textContent = `Étape ${step + 1} sur ${questions.length}`;
    progress.style.width = `${((step + 1) / questions.length) * 100}%`;
    next.disabled = answers[q.key] === undefined;
    next.textContent = step === questions.length - 1 ? "Voir mes résultats" : "Suivant";
    prev.disabled = step === 0;
    stage.innerHTML = `<h1>${escapeHtml(q.title)}</h1><p>${escapeHtml(q.intro)}</p><div class="question-grid">${q.options.map((o) => `<button class="question-option ${String(answers[q.key]) === String(o.id) ? "active" : ""}" data-answer="${String(o.id)}"><h3>${escapeHtml(o.label)}</h3><p>${escapeHtml(o.desc)}</p></button>`).join("")}</div>`;
    stage.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => { const raw = button.dataset.answer; answers[q.key] = raw === "true" ? true : raw === "false" ? false : raw; draw(); }));
  }
  prev.onclick = () => { if (step > 0) { step -= 1; draw(); } };
  next.onclick = () => { if (step < questions.length - 1) { step += 1; draw(); return; } localStorage.setItem("crp_answers", JSON.stringify(answers)); navigate("/resultats"); };
  draw();
}

function optionFromArray([id, label, desc]) { return { id, label, desc }; }
function scoreTools(tools, answers) {
  const weights = { besoin: 34, budget: 20, niveau: 14, priorite: 12, api: 10, francais: 10 };
  const limits = { gratuit: 0, petit: 15, moyen: 40, eleve: Infinity };
  return tools.map((tool) => {
    const price = Number(tool.monthly_price || 0);
    const besoin = answers.besoin ? (tool.category === answers.besoin ? weights.besoin : weights.besoin * .12) : weights.besoin * .5;
    let budget = weights.budget * .5;
    if (answers.budget) { const limit = limits[answers.budget] ?? Infinity; budget = price <= 0 ? weights.budget : answers.budget === "gratuit" ? 0 : price <= limit ? weights.budget : Math.round(weights.budget * Math.min(limit / price, 1)); }
    const niveau = answers.niveau ? ((tool.levels || []).includes(answers.niveau) ? weights.niveau : 0) : weights.niveau * .5;
    const priorite = priorityScore(tool, answers.priorite, weights.priorite);
    const apiScore = answers.apiRequise ? (tool.api_available ? weights.api : 0) : weights.api;
    const francais = answers.francaisRequis ? (tool.french_support ? weights.francais : 0) : weights.francais;
    return { ...tool, score_total: besoin + budget + niveau + priorite + apiScore + francais };
  }).sort((a, b) => b.score_total - a.score_total);
}
function priorityScore(tool, priority, max) {
  if (!priority) return max * .5;
  if (priority === "simplicite") return (tool.levels || []).includes("debutant") ? max : max * .35;
  if (priority === "integration") return tool.api_available ? max : max * .25;
  if (priority === "confidentialite") return tool.french_support && Number(tool.monthly_price || 0) <= 40 ? max : max * .45;
  return Math.round(max * Math.min(Number(tool.editorial_score || 0) / 92, 1));
}
function resultCard(tool, index) {
  return `<article class="result-card"><div class="rank">${index + 1}</div><div><h2>${escapeHtml(tool.name)}</h2><p>${escapeHtml(tool.description)}</p><div class="tags"><span class="tag">${escapeHtml(tool.price_label)}</span><span class="tag">${tool.api_available ? "API" : "Sans API"}</span><span class="tag">${tool.french_support ? "Français" : "Anglais"}</span></div></div><div class="score-circle"><strong>${Math.round(tool.score_total)}</strong></div><a class="btn ghost" href="/outil/${tool.slug}" data-link>Voir</a></article>`;
}
function bindFilters() {
  const search = document.querySelector("[data-filter-search]");
  const category = document.querySelector("[data-filter-category]");
  const budget = document.querySelector("[data-filter-budget]");
  const list = document.querySelector("[data-tools-list]");
  const apply = () => { const q = search.value.toLowerCase(); const c = category.value; const b = budget.value; const filtered = state.tools.filter((tool) => (!q || `${tool.name} ${tool.description}`.toLowerCase().includes(q)) && (!c || tool.category === c) && (!b || (b === "free" ? Number(tool.monthly_price) <= 0 : Number(tool.monthly_price) > 0))); list.innerHTML = filtered.map(toolCard).join(""); };
  [search, category, budget].forEach((el) => el.addEventListener("input", apply));
}
function bindAdmin() {
  bindAdminLogin();
  document.querySelector(".admin-layout")?.addEventListener("click", async (event) => { if (!event.target.closest("[data-admin-logout]")) return; await api("/api/admin/logout", { method: "POST" }).catch(() => null); const main = document.querySelector("[data-admin-main]"); if (main) main.innerHTML = adminLogin() + `<p class="notice">Vous êtes déconnecté.</p>`; bindAdminLogin(); });
  document.querySelectorAll("[data-admin-section]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); document.querySelectorAll("[data-admin-section]").forEach((l) => l.classList.remove("active")); link.classList.add("active"); renderAdminSection(link.dataset.adminSection); }));
}
function bindAdminLogin() {
  document.querySelector(".admin-login")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/api/admin/login", { method: "POST", body: Object.fromEntries(new FormData(event.target)) }); renderAdminSection("dashboard"); } catch (error) { document.querySelector("[data-admin-message]").innerHTML = `<p class="notice error">${escapeHtml(error.message)}</p>`; } });
}
async function submitContact(event) { event.preventDefault(); await api("/api/contact", { method: "POST", body: Object.fromEntries(new FormData(event.target)) }); document.querySelector("[data-form-message]").innerHTML = `<p class="notice">Message envoyé.</p>`; event.target.reset(); }
async function submitSuggestion(event) { event.preventDefault(); await api("/api/suggest-tool", { method: "POST", body: Object.fromEntries(new FormData(event.target)) }); document.querySelector("[data-form-message]").innerHTML = `<p class="notice">Outil proposé. Merci.</p>`; event.target.reset(); }
async function newsletterSubmit(event) { event.preventDefault(); await api("/api/newsletter", { method: "POST", body: Object.fromEntries(new FormData(event.target)) }); event.target.reset(); }
async function saveLeadPrompt() { const email = prompt("Votre email pour recevoir ces résultats ?"); if (!email) return; const answers = JSON.parse(localStorage.getItem("crp_answers") || "{}"); const results = scoreTools(state.tools, answers).slice(0, 3); await api("/api/leads", { method: "POST", body: { email, answers, results } }); alert("Résultats sauvegardés."); }
function toolCard(tool) { return `<a class="tool-card" href="/outil/${tool.slug}" data-link><div class="tool-top"><div class="logo">${escapeHtml(tool.name[0] || "C")}</div><div><span class="tag">${escapeHtml(tool.category)}</span><h3>${escapeHtml(tool.name)}</h3></div></div><p>${escapeHtml(tool.description)}</p><div class="tags"><span class="tag">${escapeHtml(tool.price_label)}</span><span class="tag">${tool.editorial_score}/100</span>${tool.api_available ? '<span class="tag">API</span>' : ""}${tool.french_support ? '<span class="tag">Français</span>' : ""}</div></a>`; }
function categoryCard(category) { return `<a class="category-card" href="/outils" data-link><h3>${escapeHtml(category.name)}</h3><p>${escapeHtml(category.description || "")}</p></a>`; }
function infoList(title, items) { return `<h2>${title}</h2><ul>${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`; }
function tags(items) { return `<div class="tags">${(items || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>`; }
function notFoundPage() { return `<section class="page"><p class="eyebrow">404</p><h1>Page introuvable</h1><a class="btn" href="/" data-link>Retour accueil</a></section>`; }
function navigate(path) { history.pushState({}, "", path); render(); }
async function api(url, options = {}) { const response = await fetch(url, { method: options.method || "GET", headers: { "Content-Type": "application/json" }, credentials: "include", body: options.body ? JSON.stringify(options.body) : undefined }); if (!response.ok) { const data = await response.json().catch(() => ({})); const error = new Error(data.error || "Erreur API"); error.status = response.status; throw error; } if (response.status === 204) return null; return response.json(); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
boot().catch((error) => { document.querySelector("#app").innerHTML = `<section class="page"><h1>Erreur de chargement</h1><p>${escapeHtml(error.message)}</p></section>`; });
