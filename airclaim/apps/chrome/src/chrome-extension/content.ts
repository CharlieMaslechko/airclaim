// content.ts
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data.type === "STAKE_TOKEN") {
    console.log(
      "[content] received token from injected:",
      event.data.token.slice(0, 10) + "…"
    );
    chrome.runtime.sendMessage({
      type: "ACCESS_TOKEN",
      token: event.data.token,
    });
  }
});

// Inject the script into the page context
const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
(document.head || document.documentElement).appendChild(script);
script.remove();
