(() => {
  if (typeof api === "undefined") return;
  const send = () => api("/api/analytics/view", { method: "POST", body: { path: location.pathname, source: document.referrer, device_type: innerWidth < 760 ? "mobile" : "desktop" } }).catch(() => null);
  const originalPushState = history.pushState;
  history.pushState = function patchedPushState(...args) {
    const result = originalPushState.apply(this, args);
    setTimeout(send, 0);
    return result;
  };
  window.addEventListener("popstate", () => setTimeout(send, 0));
})();
