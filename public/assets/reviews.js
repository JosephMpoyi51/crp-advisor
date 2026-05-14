(() => {
  if (typeof state === "undefined") return;

  const originalToolDetailPage = toolDetailPage;
  toolDetailPage = function reviewedToolDetailPage(path) {
    const html = originalToolDetailPage(path);
    const slug = path.split("/").pop();
    return html.replace("</section>", `${reviewSection(slug)}</section>`);
  };

  const originalBindPage = bindPage;
  bindPage = function reviewedBindPage(path) {
    originalBindPage(path);
    if (path.startsWith("/outil/")) bindReviewForm(path.split("/").pop());
    if (path === "/admin") bindAdminReviewActions();
  };

  const originalRenderAdminSection = renderAdminSection;
  renderAdminSection = async function reviewedAdminSection(section = "dashboard") {
    if (section !== "reviews") return originalRenderAdminSection(section);
    const main = document.querySelector("[data-admin-main]");
    if (!main) return;
    main.innerHTML = `<p class="notice">Chargement des avis...</p>`;
    try {
      const rows = await api("/api/admin/reviews");
      main.innerHTML = adminHeader("Gestion des avis") + `<div class="table-wrap"><table><thead><tr><th>Outil</th><th>Auteur</th><th>Email</th><th>Note</th><th>Avis</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows.map(adminReviewRow).join("")}</tbody></table></div>`;
      bindAdminReviewActions();
    } catch (error) {
      main.innerHTML = adminLogin() + `<p class="notice error">${escapeHtml(error.message)}</p>`;
      if (typeof bindAdminLogin === "function") bindAdminLogin();
    }
  };

  function reviewSection(slug) {
    return `<section class="review-section panel card"><p class="eyebrow">Avis utilisateurs</p><h2>Donnez votre avis</h2><p>Votre avis aide les autres utilisateurs à choisir le bon outil. Il sera affiché après validation.</p><form class="review-form" data-review-form><input name="first_name" placeholder="Votre prénom" required><input name="email" type="email" placeholder="Votre email" required><select name="rating" required><option value="5">5 - Excellent</option><option value="4">4 - Très bien</option><option value="3">3 - Correct</option><option value="2">2 - Limité</option><option value="1">1 - Décevant</option></select><textarea name="content" placeholder="Votre avis" required></textarea><input type="hidden" name="tool_slug" value="${escapeAttribute(slug)}"><button class="btn" type="submit">Envoyer mon avis</button><div class="review-message" data-review-message></div></form><div class="review-list" data-review-list><p class="notice">Chargement des avis...</p></div></section>`;
  }

  async function bindReviewForm(slug) {
    const form = document.querySelector("[data-review-form]");
    const message = document.querySelector("[data-review-message]");
    await loadPublicReviews(slug);
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const body = Object.fromEntries(new FormData(form));
        await api("/api/reviews", { method: "POST", body });
        message.innerHTML = `<p class="notice">Merci. Votre avis sera publié après validation.</p>`;
        form.reset();
      } catch (error) {
        message.innerHTML = `<p class="notice error">${escapeHtml(error.message)}</p>`;
      }
    });
  }

  async function loadPublicReviews(slug) {
    const list = document.querySelector("[data-review-list]");
    if (!list) return;
    try {
      const reviews = await api(`/api/reviews/${slug}`);
      list.innerHTML = reviews.length ? reviews.map(reviewCard).join("") : `<p class="notice">Aucun avis publié pour le moment.</p>`;
    } catch {
      list.innerHTML = `<p class="notice error">Impossible de charger les avis.</p>`;
    }
  }

  function reviewCard(review) {
    return `<article class="review-card"><header><strong>${escapeHtml(review.first_name || "Utilisateur")}</strong><span class="review-stars">${stars(review.rating)}</span></header><p>${escapeHtml(review.content)}</p></article>`;
  }

  function adminReviewRow(review) {
    const approved = Number(review.approved) === 1;
    return `<tr><td>${escapeHtml(review.tool_slug)}</td><td>${escapeHtml(review.first_name)}</td><td>${escapeHtml(review.email)}</td><td>${stars(review.rating)}</td><td>${escapeHtml(review.content)}</td><td>${approved ? "Publié" : "En attente"}</td><td><div class="admin-review-actions"><button class="btn ghost" type="button" data-review-approve="${review.id}" data-approved="${approved ? "0" : "1"}">${approved ? "Masquer" : "Approuver"}</button><button class="btn ghost" type="button" data-review-delete="${review.id}">Supprimer</button></div></td></tr>`;
  }

  function bindAdminReviewActions() {
    document.querySelector("[data-admin-main]")?.addEventListener("click", async (event) => {
      const approve = event.target.closest("[data-review-approve]");
      const remove = event.target.closest("[data-review-delete]");
      if (!approve && !remove) return;
      if (approve) await api(`/api/admin/reviews/${approve.dataset.reviewApprove}`, { method: "PATCH", body: { approved: approve.dataset.approved === "1" } });
      if (remove && confirm("Supprimer cet avis ?")) await api(`/api/admin/reviews/${remove.dataset.reviewDelete}`, { method: "DELETE" });
      renderAdminSection("reviews");
    }, { once: true });
  }

  function stars(value) {
    const rating = Math.max(1, Math.min(5, Number(value || 5)));
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }
})();
