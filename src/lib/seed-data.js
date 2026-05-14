const categories = [
  { slug: "redaction", name: "Rédaction", description: "Textes, articles, copywriting et assistants généralistes" },
  { slug: "image", name: "Image", description: "Génération, édition et création visuelle" },
  { slug: "code", name: "Code", description: "Développement, debug et productivité logicielle" },
  { slug: "recherche", name: "Recherche", description: "Veille, sources et informations à jour" },
  { slug: "productivite", name: "Productivité", description: "Organisation, notes, réunions et opérations" },
  { slug: "marketing", name: "Marketing", description: "SEO, publicité, CRM et contenu commercial" },
  { slug: "audio", name: "Audio", description: "Voix, transcription, podcast et narration" },
  { slug: "video", name: "Vidéo", description: "Génération et édition vidéo IA" },
  { slug: "automatisation", name: "Automatisation", description: "Workflows, agents et intégrations" },
  { slug: "design", name: "Design", description: "UI, présentations, marque et assets visuels" }
];

const iconUrls = {
  chatgpt: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=64",
  claude: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64",
  mistral: "https://www.google.com/s2/favicons?domain=mistral.ai&sz=64",
  gemini: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
  perplexity: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64",
  "github-copilot": "https://www.google.com/s2/favicons?domain=github.com&sz=64",
  midjourney: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64",
  "notion-ai": "https://www.google.com/s2/favicons?domain=notion.com&sz=64",
  elevenlabs: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64",
  runway: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64"
};

const officialUrls = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/",
  mistral: "https://mistral.ai/",
  gemini: "https://gemini.google.com/",
  perplexity: "https://www.perplexity.ai/",
  "github-copilot": "https://github.com/features/copilot",
  midjourney: "https://www.midjourney.com/",
  "notion-ai": "https://www.notion.com/product/ai",
  elevenlabs: "https://elevenlabs.io/",
  runway: "https://runwayml.com/"
};

const tools = [
  tool("chatgpt", "ChatGPT", "redaction", "Assistant IA polyvalent pour rédiger, analyser, coder, résumer et générer des idées.", "Gratuit", 0, true, true, ["debutant", "intermediaire", "avance"], 92, true),
  tool("claude", "Claude", "redaction", "Assistant reconnu pour les textes nuancés et l'analyse de longs documents.", "Gratuit", 0, true, true, ["intermediaire", "avance"], 90, true),
  tool("mistral", "Mistral AI", "redaction", "Solution européenne performante en français avec API et options open source.", "Gratuit", 0, true, true, ["intermediaire", "avance"], 85, false),
  tool("gemini", "Gemini", "recherche", "Assistant multimodal de Google pour rechercher, analyser et travailler avec Workspace.", "Gratuit", 0, true, true, ["debutant", "intermediaire"], 82, false),
  tool("perplexity", "Perplexity AI", "recherche", "Moteur de recherche IA avec sources citées, idéal pour la veille et le fact-checking.", "Gratuit", 0, true, true, ["debutant", "intermediaire", "avance"], 88, true),
  tool("github-copilot", "GitHub Copilot", "code", "Assistant de programmation intégré aux IDE pour compléter, expliquer et générer du code.", "Gratuit limité", 0, false, false, ["intermediaire", "avance"], 91, true),
  tool("midjourney", "Midjourney", "image", "Générateur d'images IA reconnu pour des visuels artistiques de très haute qualité.", "10 $/mois", 10, false, false, ["intermediaire", "avance"], 93, true),
  tool("notion-ai", "Notion AI", "productivite", "Assistant intégré à Notion pour rédiger, résumer, traduire et organiser les informations.", "10 $/mois", 10, false, true, ["debutant", "intermediaire"], 78, false),
  tool("elevenlabs", "ElevenLabs", "audio", "Plateforme de synthèse vocale et de clonage de voix pour produire des audios naturels.", "Gratuit", 0, true, true, ["debutant", "intermediaire", "avance"], 91, true),
  tool("runway", "Runway", "video", "Suite créative IA pour générer, modifier et améliorer des vidéos.", "Gratuit", 0, true, false, ["intermediaire", "avance"], 87, false)
];

const articles = [
  article("comment-choisir-un-outil-ia", "Comment choisir un outil IA sans perdre de temps", "Une méthode simple pour comparer les outils IA selon votre besoin réel, votre budget et votre niveau.", "Guide", "Joseph Mpoyi", "JM", "2026-05-14", 6, ["Définissez d'abord votre usage principal : rédaction, recherche, image, code ou automatisation. Ensuite, comparez les outils sur quatre axes : facilité d'utilisation, budget, qualité des résultats et intégrations.", "Un bon outil IA n'est pas forcément celui qui a le plus de fonctionnalités. C'est celui qui réduit la friction dans votre travail quotidien et qui reste fiable pour vos cas d'usage réels.", "Avant de payer, testez la version gratuite, vérifiez les limites, l'export des données, la confidentialité et la disponibilité d'une API si vous voulez connecter l'outil à votre workflow."]),
  article("meilleurs-outils-ia-pour-pme", "Les meilleurs outils IA pour les PME", "Un panorama pratique pour choisir les solutions IA utiles aux petites équipes.", "PME", "Équipe CRP Advisor", "CA", "2026-05-13", 5, ["Les PME ont besoin d'outils simples à déployer, faciles à expliquer aux équipes et capables de produire un gain rapide.", "Pour commencer, privilégiez un assistant généraliste, un outil de recherche avec sources, un outil de création visuelle et une solution de productivité.", "La meilleure approche consiste à tester un petit nombre d'outils avec des objectifs mesurables : temps gagné, qualité produite, adoption par l'équipe et coût mensuel."]),
  article("chatgpt-claude-gemini-comparatif", "ChatGPT, Claude ou Gemini : lequel choisir ?", "Comparatif rapide des trois grands assistants IA généralistes.", "Comparatif", "Joseph Mpoyi", "JM", "2026-05-12", 7, ["ChatGPT reste très polyvalent pour la rédaction, l'analyse, le code et les usages quotidiens. Claude est souvent apprécié pour les longs documents et la qualité rédactionnelle.", "Gemini devient particulièrement intéressant pour les personnes déjà ancrées dans l'écosystème Google et les usages multimodaux.", "Le bon choix dépend de votre contexte : documents longs, recherche web, intégrations, budget et préférence d'interface."]),
  article("outils-ia-pour-createurs", "Outils IA pour créateurs : image, vidéo, audio", "Comment composer une boîte à outils créative avec Midjourney, Runway et ElevenLabs.", "Création", "Équipe CRP Advisor", "CA", "2026-05-10", 4, ["Les créateurs ont intérêt à combiner plusieurs outils spécialisés plutôt qu'à chercher une solution unique.", "Midjourney peut couvrir la direction artistique, Runway la vidéo et ElevenLabs la voix. Le plus important reste la cohérence du workflow.", "Avant de publier, vérifiez toujours les droits d'utilisation, les options commerciales et la qualité d'export."]),
  article("automatiser-son-workflow-ia", "Automatiser son workflow avec l'IA", "Les critères à regarder avant d'intégrer un outil IA à vos processus.", "Automatisation", "Joseph Mpoyi", "JM", "2026-05-08", 6, ["L'automatisation IA devient utile lorsque les tâches sont répétitives, bien définies et mesurables.", "Avant de connecter un outil à votre CRM, site ou base de données, vérifiez la présence d'une API, la documentation, les limites de débit et la sécurité.", "Commencez petit : un formulaire, une synthèse, une notification ou un enrichissement de données. Puis élargissez progressivement."])
];

function tool(slug, name, category, description, priceLabel, monthlyPrice, apiAvailable, frenchSupport, levels, score, featured) {
  return { slug, name, category, description, price_label: priceLabel, monthly_price: monthlyPrice, api_available: apiAvailable, french_support: frenchSupport, levels, editorial_score: score, g2_rating: 4.5, is_featured: featured, icon_url: iconUrls[slug] || "", affiliate_url: officialUrls[slug] || "#", use_cases: ["Usage professionnel", "Gain de temps", "Création assistée"], advantages: ["Interface moderne", "Bon rapport valeur", "Solution reconnue"], limits: ["Vérifier les données sensibles", "Comparer selon votre contexte"], ideal_profile: "Professionnels, créateurs, freelances et PME.", alternatives: [] };
}

function article(slug, title, excerpt, category, author, initials, publishedAt, readingMinutes, paragraphs) {
  return { slug, title, excerpt, category, author, author_initials: initials, author_avatar: "", published_at: publishedAt, reading_minutes: readingMinutes, content: paragraphs.join("\n\n") };
}

module.exports = { categories, tools, articles };
