function scoreTools(tools, answers) {
  const weights = { besoin: 34, budget: 20, niveau: 14, priorite: 12, api: 10, francais: 10 };
  const limits = { gratuit: 0, petit: 15, moyen: 40, eleve: Infinity };

  return tools
    .map((tool) => {
      const besoin = !answers.besoin ? weights.besoin * 0.5 : tool.category === answers.besoin ? weights.besoin : weights.besoin * 0.12;
      const price = Number(tool.monthly_price || 0);
      let budget = weights.budget * 0.5;

      if (answers.budget) {
        const limit = limits[answers.budget] ?? Infinity;
        if (price <= 0) budget = weights.budget;
        else if (answers.budget === "gratuit") budget = 0;
        else if (price <= limit) budget = weights.budget;
        else budget = Math.round(weights.budget * Math.min(limit / price, 1));
      }

      const niveau = !answers.niveau ? weights.niveau * 0.5 : tool.levels.includes(answers.niveau) ? weights.niveau : 0;
      const priorite = scorePriority(tool, answers.priorite, weights.priorite);
      const api = !answers.apiRequise ? weights.api : tool.api_available ? weights.api : 0;
      const francais = !answers.francaisRequis ? weights.francais : tool.french_support ? weights.francais : 0;
      const score = besoin + budget + niveau + priorite + api + francais;

      return {
        ...tool,
        score_total: score,
        score_details: { besoin, budget, niveau, priorite, api, francais },
        explanation: explain(tool, answers, score)
      };
    })
    .sort((a, b) => b.score_total - a.score_total);
}

function scorePriority(tool, priority, max) {
  if (!priority) return max * 0.5;
  if (priority === "simplicite") return tool.levels.includes("debutant") ? max : max * 0.35;
  if (priority === "qualite") return Math.round(max * Math.min(Number(tool.editorial_score || 0) / 92, 1));
  if (priority === "integration") return tool.api_available ? max : max * 0.25;
  if (priority === "confidentialite") return tool.french_support && Number(tool.monthly_price || 0) <= 40 ? max : max * 0.45;
  return max * 0.5;
}

function explain(tool, answers) {
  const parts = [`${tool.name} correspond bien a votre profil.`];
  if (answers.besoin && tool.category === answers.besoin) parts.push("Il repond directement a votre besoin principal.");
  if (answers.budget === "gratuit" && Number(tool.monthly_price || 0) === 0) parts.push("Son offre gratuite respecte votre budget.");
  if (answers.niveau && tool.levels.includes(answers.niveau)) parts.push("Son niveau d'utilisation est adapte a votre experience.");
  if (answers.apiRequise && tool.api_available) parts.push("Une API est disponible pour vos integrations.");
  if (answers.francaisRequis && tool.french_support) parts.push("Le support du francais est disponible.");
  return parts.join(" ");
}

module.exports = { scoreTools };
