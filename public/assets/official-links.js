window.CRP_OFFICIAL_TOOL_URLS = {
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

window.CRP_TOOL_ICONS = {
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

(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!url.startsWith("/api/tools")) return response;
    const clone = response.clone();
    try {
      const data = await clone.json();
      const patchTool = (tool) => ({
        ...tool,
        affiliate_url: tool.affiliate_url && tool.affiliate_url !== "#" ? tool.affiliate_url : window.CRP_OFFICIAL_TOOL_URLS[tool.slug] || tool.affiliate_url,
        icon_url: tool.icon_url || window.CRP_TOOL_ICONS[tool.slug] || ""
      });
      const patched = Array.isArray(data) ? data.map(patchTool) : patchTool(data);
      return new Response(JSON.stringify(patched), { status: response.status, statusText: response.statusText, headers: response.headers });
    } catch {
      return response;
    }
  };
})();
