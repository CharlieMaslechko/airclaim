// injected.js
(function () {
  const token = localStorage.getItem("session");
  console.log("[injected] token from localStorage:", token?.slice(0, 10) + "…");
  if (token) {
    window.postMessage({ type: "STAKE_TOKEN", token }, "*");
  }
})();
