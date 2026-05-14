(() => {
  if (typeof routes === "undefined" || typeof state === "undefined") return;

  routes["/outils"] = advancedToolsPage;
  routes["/comparer"] = advancedComparePage;

  function advancedToolsPage() {
    return `<section class="page"><p class="eyebrow">Annuaire IA</p><h1>Tous les outils IA</h1><p class="lead">Filtrez les outils par besoin, profil utilisateur, budget, niveau, usage et type de solution.</p>${advancedFilters()}<div class="filter-summary"><span data-filter-count>${state.tools.length} outils affichés</span><button class="btn ghost" type="button" data-reset-filters>Réinitialiser</button></div><div class="grid tools" data-tools-list>${state.tools.map(enhancedToolCard).join("")}</div><div class="compare-dock"><div><strong data-compare-count>0 outil sélectionné</strong><p>Choisissez 2 à 4 outils pour ouvrir une comparaison côte à côte.</p></div><a class="btn" href="/comparer" data-link data-open-comparison>Comparer la sélection</a></div></section>`;
  }

  function advancedComparePage() {
    const selected = getSelectedTools();
    const tools = selected.length ? selected : state.tools.slice(0, 3);
    const notice = selected.length ? "Comparaison de votre sélection." : "Sélectionnez 2 à 4 outils depuis l'annuaire. En attendant, voici un exemple avec les mieux notés.";
    return `<section class="page"><p class="eyebrow">Comparateur</p><h1>Comparaison côte à côte</h1><p class="lead">${notice}</p>${selected.length < 2 ? `<div class="compare-empty">Pour un vrai comparatif personnalisé, retournez dans Outils et cochez au moins 2 solutions.</div>` : ""}<div class="table-wrap"><div class="compare-grid" style="grid-template-columns: repeat(${Math.min(Math.max(tools.length, 2), 4)}, minmax(220px, 1fr));">${tools.slice(0, 4).map(compareColumn).join("")}</div></div></section>`;
  }

  function advancedFilters() {
    return `<div class="advanced-filters"><input data-filter-search placeholder="Rechercher un outil"><select data-filter-category><option value="">Catégorie</option>${state.categories.map((c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join("")}</select><select data-filter-need><option value="">Besoin principal</option><option value="redaction">Rédaction</option><option value="recherche">Recherche</option><option value="image">Création visuelle</option><option value="code">Code</option><option value="marketing">Marketing</option><option value="productivite">Productivité</option><option value="audio">Audio</option><option value="video">Vidéo</option><option value="automatisation">Automatisation</option></select><select data-filter-user><option value="">Type d'utilisateur</option><option value="particulier">Particulier</option><option value="freelance">Freelance</option><option value="pme">PME</option><option value="equipe">Équipe</option><option value="developpeur">Développeur</option><option value="createur">Créateur</option></select><select data-filter-budget><option value="">Budget</option><option value="free">Gratuit</option><option value="low">Moins de 15 €/mois</option><option value="medium">Moins de 40 €/mois</option><option value="paid">Payant</option></select><select data-filter-difficulty><option value="">Niveau de difficulté</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="avance">Avancé</option></select><select data-filter-scope><option value="">Usage</option><option value="personnel">Personnel</option><option value="professionnel">Professionnel</option></select><select data-filter-solution><option value="">Type de solution</option><option value="cloud">Cloud</option><option value="wordpress">WordPress</option><option value="ia">IA</option><option value="saas">SaaS</option><option value="api">API</option></select></div>`;
  }

  function bindAdvancedTools() {
    const controls = document.querySelectorAll(".advanced-filters [data-filter-search], .advanced-filters select");
    const list = document.querySelector("[data-tools-list]");
    const count = document.querySelector("[data-filter-count]");
    const compareCount = document.querySelector("[data-compare-count]");
    if (!list) return;

    const updateCompareCount = () => {
      const total = getSelectedSlugs().length;
      if (compareCount) compareCount.textContent = `${total} outil${total > 1 ? "s" : ""} sélectionné${total > 1 ? "s" : ""}`;
    };

    const apply = () => {
      const filtered = state.tools.filter(matchesFilters);
      list.innerHTML = filtered.map(enhancedToolCard).join("");
      if (count) count.textContent = `${filtered.length} outil${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}`;
      updateCompareCount();
    };

    controls.forEach((control) => control.addEventListener("input", apply));
    document.querySelector("[data-reset-filters]")?.addEventListener("click", () => { controls.forEach((control) => { control.value = ""; }); apply(); });
    list.addEventListener("change", (event) => {
      const input = event.target.closest("[data-compare-tool]");
      if (!input) return;
      toggleCompare(input.value, input.checked);
      input.checked = getSelectedSlugs().includes(input.value);
      updateCompareCount();
    });
    updateCompareCount();
  }

  function matchesFilters(tool) {
    const root = document.querySelector(".advanced-filters");
    if (!root) return true;
    const values = {
      search: root.querySelector("[data-filter-search]")?.value.toLowerCase() || "",
      category: root.querySelector("[data-filter-category]")?.value || "",
      need: root.querySelector("[data-filter-need]")?.value || "",
      user: root.querySelector("[data-filter-user]")?.value || "",
      budget: root.querySelector("[data-filter-budget]")?.value || "",
      difficulty: root.querySelector("[data-filter-difficulty]")?.value || "",
      scope: root.querySelector("[data-filter-scope]")?.value || "",
      solution: root.querySelector("[data-filter-solution]")?.value || ""
    };
    const haystack = toolText(tool);
    const price = Number(tool.monthly_price || 0);
    if (values.search && !haystack.includes(values.search)) return false;
    if (values.category && tool.category !== values.category) return false;
    if (values.need && tool.category !== values.need && !haystack.includes(values.need)) return false;
    if (values.user && !matchesUser(tool, values.user)) return false;
    if (values.budget === "free" && price > 0) return false;
    if (values.budget === "paid" && price <= 0) return false;
    if (values.budget === "low" && price > 15) return false;
    if (values.budget === "medium" && price > 40) return false;
    if (values.difficulty && !(tool.levels || []).includes(values.difficulty)) return false;
    if (values.scope && !matchesScope(tool, values.scope)) return false;
    if (values.solution && !matchesSolution(tool, values.solution)) return false;
    return true;
  }

  function enhancedToolCard(tool) {
    const checked = getSelectedSlugs().includes(tool.slug) ? "checked" : "";
    const icon = tool.icon_url ? `<img src="${escapeAttribute(tool.icon_url)}" alt="" loading="lazy" onerror="this.remove()">` : escapeHtml(tool.name[0] || "C");
    return `<article class="tool-card"><a href="/outil/${tool.slug}" data-link><div class="tool-top"><div class="logo">${icon}</div><div><span class="tag">${escapeHtml(tool.category)}</span><h3>${escapeHtml(tool.name)}</h3></div></div><p>${escapeHtml(tool.description)}</p></a><div class="tags"><span class="tag">${escapeHtml(tool.price_label)}</span><span class="tag">${freePlan(tool)}</span><span class="tag">${difficultyLabel(tool)}</span>${tool.api_available ? '<span class="tag">API</span>' : ""}</div><label class="compare-picker"><input type="checkbox" value="${escapeAttribute(tool.slug)}" data-compare-tool ${checked}> Comparer</label></article>`;
  }

  function compareColumn(tool) {
    const icon = tool.icon_url ? `<div class="logo"><img src="${escapeAttribute(tool.icon_url)}" alt="" loading="lazy" onerror="this.remove()"></div>` : `<div class="logo">${escapeHtml(tool.name[0] || "C")}</div>`;
    return `<article class="compare-column"><header>${icon}<h2>${escapeHtml(tool.name)}</h2></header>${compareRow("Usage principal", usageMain(tool))}${compareRow("Prix", tool.price_label || "Non renseigné")}${compareRow("Version gratuite", freePlan(tool))}${compareList("Points forts", tool.advantages)}${compareList("Limites", tool.limits)}${compareRow("Note", `${tool.editorial_score || 0}/100`)}${compareRow("Meilleur profil utilisateur", tool.ideal_profile || bestProfile(tool))}${compareRow("Lien d'accès", `<a class="btn ghost" href="${escapeAttribute(tool.affiliate_url || "#")}" target="_blank" rel="nofollow noopener">Ouvrir</a>`, true)}${compareRow("Verdict rapide", verdict(tool))}</article>`;
  }

  function compareRow(label, value, html = false) { return `<div class="compare-row"><span>${label}</span>${html ? value : `<p>${escapeHtml(value)}</p>`}</div>`; }
  function compareList(label, items) { const list = Array.isArray(items) && items.length ? items : ["À compléter dans l'admin"]; return `<div class="compare-row"><span>${label}</span><ul>${list.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`; }
  function usageMain(tool) { return (tool.use_cases || [])[0] || categoryLabel(tool.category); }
  function freePlan(tool) { return Number(tool.monthly_price || 0) <= 0 ? "Oui" : "Non"; }
  function difficultyLabel(tool) { const levels = tool.levels || []; if (levels.includes("debutant")) return "Débutant"; if (levels.includes("intermediaire")) return "Intermédiaire"; return "Avancé"; }
  function bestProfile(tool) { return tool.french_support ? "Indépendants, PME et équipes francophones" : "Utilisateurs à l'aise avec l'anglais"; }
  function verdict(tool) { if (tool.editorial_score >= 90) return "Excellent choix si l'usage correspond à votre besoin."; if (tool.api_available) return "Très intéressant pour les workflows connectés."; return "Bon choix à comparer selon le budget et la simplicité."; }
  function categoryLabel(slug) { return (state.categories.find((category) => category.slug === slug) || {}).name || slug || "Usage général"; }
  function toolText(tool) { return `${tool.name} ${tool.category} ${tool.description} ${(tool.use_cases || []).join(" ")} ${(tool.advantages || []).join(" ")} ${tool.ideal_profile || ""}`.toLowerCase(); }
  function matchesUser(tool, user) { const text = toolText(tool); if (user === "developpeur") return tool.category === "code" || tool.api_available || text.includes("api"); if (user === "createur") return ["image", "audio", "video", "design", "marketing"].includes(tool.category); if (user === "pme" || user === "equipe") return text.includes("pme") || text.includes("professionnel") || tool.api_available; if (user === "freelance") return text.includes("freelance") || ["redaction", "marketing", "design", "productivite"].includes(tool.category); return (tool.levels || []).includes("debutant") || Number(tool.monthly_price || 0) <= 15; }
  function matchesScope(tool, scope) { const text = toolText(tool); return scope === "professionnel" ? text.includes("professionnel") || tool.api_available || Number(tool.editorial_score || 0) >= 85 : Number(tool.monthly_price || 0) <= 15 || (tool.levels || []).includes("debutant"); }
  function matchesSolution(tool, solution) { if (solution === "ia") return true; if (solution === "api") return tool.api_available; if (solution === "wordpress") return tool.category === "marketing" || tool.category === "redaction" || tool.category === "automatisation"; if (solution === "saas" || solution === "cloud") return true; return true; }
  function getSelectedSlugs() { return JSON.parse(localStorage.getItem("crp_compare_tools") || "[]"); }
  function getSelectedTools() { const slugs = getSelectedSlugs(); return slugs.map((slug) => state.tools.find((tool) => tool.slug === slug)).filter(Boolean); }
  function toggleCompare(slug, checked) { let slugs = getSelectedSlugs(); if (checked && !slugs.includes(slug)) { if (slugs.length >= 4) { alert("Vous pouvez comparer jusqu'à 4 outils à la fois."); return; } slugs.push(slug); } if (!checked) slugs = slugs.filter((item) => item !== slug); localStorage.setItem("crp_compare_tools", JSON.stringify(slugs)); }

  const originalBindPage = bindPage;
  bindPage = function patchedBindPage(path) {
    originalBindPage(path);
    if (path === "/outils") bindAdvancedTools();
  };
})();
