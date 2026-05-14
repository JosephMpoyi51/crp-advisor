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

(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!url.startsWith("/api/tools")) return response;
    const clone = response.clone();
    try {
      const data = await clone.json();
      const patchTool = (tool) => ({ ...tool, affiliate_url: tool.affiliate_url && tool.affiliate_url !== "#" ? tool.affiliate_url : window.CRP_OFFICIAL_TOOL_URLS[tool.slug] || tool.affiliate_url });
      const patched = Array.isArray(data) ? data.map(patchTool) : patchTool(data);
      return new Response(JSON.stringify(patched), { status: response.status, statusText: response.statusText, headers: response.headers });
    } catch {
      return response;
    }
  };
})();
