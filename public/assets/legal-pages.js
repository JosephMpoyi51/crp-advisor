(() => {
  if (typeof routes === "undefined") return;

  const pages = {
    "/a-propos": {
      eyebrow: "À propos",
      title: "À propos de CRP Advisor",
      body: "CRP Advisor est un comparateur indépendant conçu pour aider les utilisateurs à identifier, comparer et choisir les outils IA les plus adaptés à leurs besoins, leur budget, leur niveau et leur contexte professionnel."
    },
    "/conditions-utilisation": {
      eyebrow: "Conditions",
      title: "Conditions d'utilisation",
      body: "L'utilisation de CRP Advisor implique l'acceptation d'un usage responsable du service. Les informations publiées servent d'aide à la décision et doivent être vérifiées sur les sites officiels des outils avant tout achat ou engagement."
    },
    "/politique-confidentialite": {
      eyebrow: "Confidentialité",
      title: "Politique de confidentialité",
      body: "CRP Advisor collecte uniquement les informations nécessaires aux fonctionnalités proposées, comme les formulaires de contact, les avis, la newsletter et les recommandations. Les données ne doivent pas être revendues et peuvent être supprimées sur demande."
    },
    "/mentions-legales": {
      eyebrow: "Mentions légales",
      title: "Mentions légales",
      body: "CRP Advisor est édité pour fournir un service d'information et de comparaison d'outils IA. Les marques et noms d'outils cités appartiennent à leurs propriétaires respectifs."
    }
  };

  Object.entries(pages).forEach(([path, page]) => {
    routes[path] = () => `<section class="page"><p class="eyebrow">${page.eyebrow}</p><h1>${page.title}</h1><p class="lead">${page.body}</p><div class="actions"><a class="btn" href="/contact" data-link>Nous contacter</a><a class="btn ghost" href="/outils" data-link>Explorer les outils</a></div></section>`;
  });
})();
