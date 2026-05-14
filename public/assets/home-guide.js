(() => {
  if (typeof home !== "function") return;

  const originalHome = home;
  home = function guidedHome() {
    const html = originalHome();
    const oldFlow = `<section class="section"><div class="flow"><article><strong>1</strong><span>Décrivez votre besoin</span></article><article><strong>2</strong><span>Affinez budget et priorité</span></article><article><strong>3</strong><span>Recevez votre top 3</span></article></div></section>`;
    const newFlow = `<section class="section guide-section"><div class="section-head"><p class="eyebrow">Mode d'emploi</p><h2>Comment utiliser CRP Advisor</h2><p>Suivez ces étapes simples pour trouver un outil adapté, même si vous débutez avec les solutions IA.</p></div><div class="flow guide-flow"><article><strong>1</strong><span>Décrivez votre besoin</span><p>Commencez par indiquer ce que vous voulez faire : écrire, rechercher, créer une image, coder, automatiser ou gagner du temps. Répondez avec votre objectif réel, pas avec le nom d'un outil que vous connaissez déjà. Plus votre besoin est clair, plus la recommandation sera précise.</p></article><article><strong>2</strong><span>Affinez budget et priorité</span><p>Précisez votre budget, votre niveau et ce qui compte le plus pour vous : simplicité, qualité, intégrations ou confidentialité. Le site utilise ces réponses pour éviter les outils trop chers, trop complexes ou mal adaptés à votre usage. Vous pouvez ensuite explorer les filtres pour comparer plus finement.</p></article><article><strong>3</strong><span>Recevez votre top 3</span><p>CRP Advisor classe les outils selon vos réponses et vous propose un top 3 clair. Ouvrez chaque fiche pour lire les points forts, les limites, le profil idéal et le lien officiel. Si vous hésitez, utilisez la comparaison côte à côte pour choisir plus facilement.</p></article></div></section>`;
    return html.replace(oldFlow, newFlow);
  };

  if (typeof routes !== "undefined") routes["/"] = home;
})();
