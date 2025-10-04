import { fetchArchiveBucket } from "./api/fetchArchiveBucket";
import { fetchArchives } from "./api/fetchArchives";
import { BackgroundMessage, BackgroundResponse } from "./api/fetchArchives";

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener(
  (
    msg: BackgroundMessage,
    _sender,
    sendResponse: (res: BackgroundResponse) => void
  ) => {
    console.log("[StakeSync] Received message:", msg);

    if (msg.type === "SYNC_ARCHIVES") {
      fetchArchives()
        .then((archives) => {
          //Lets test now grabbing the actual bucket data
          fetchArchiveBucket(archives.data.user.betArchiveList[0].id)
            .then((bucket) => {
              console.log("[StakeSync] Bucket:", bucket);
            })
            .catch((err) => {
              console.error("[StakeSync] Error:", err);
            });
          console.log("[StakeSync] Archives:", archives);
          sendResponse({ ok: true, data: archives });
        })
        .catch((err) => {
          console.error("[StakeSync] Error:", err);
          sendResponse({ ok: false, error: err.message });
        });

      return true; // ✅ keep channel open for async response
    }
  }
);
