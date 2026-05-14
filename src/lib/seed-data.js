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
  { slug: "comment-choisir-un-outil-ia", title: "Comment choisir un outil IA", excerpt: "Une méthode simple pour éviter de perdre du temps.", content: "Commencez par votre besoin réel, puis regardez budget, niveau, intégrations et confidentialité.", published_at: new Date().toISOString() }
];

function tool(slug, name, category, description, priceLabel, monthlyPrice, apiAvailable, frenchSupport, levels, score, featured) {
  return {
    slug,
    name,
    category,
    description,
    price_label: priceLabel,
    monthly_price: monthlyPrice,
    api_available: apiAvailable,
    french_support: frenchSupport,
    levels,
    editorial_score: score,
    g2_rating: 4.5,
    is_featured: featured,
    affiliate_url: "#",
    use_cases: ["Usage professionnel", "Gain de temps", "Création assistée"],
    advantages: ["Interface moderne", "Bon rapport valeur", "Solution reconnue"],
    limits: ["Vérifier les données sensibles", "Comparer selon votre contexte"],
    ideal_profile: "Professionnels, créateurs, freelances et PME.",
    alternatives: []
  };
}

module.exports = { categories, tools, articles };
