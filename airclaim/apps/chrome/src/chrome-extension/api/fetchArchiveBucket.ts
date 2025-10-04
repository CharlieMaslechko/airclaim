import { Archive } from "./fetchArchives";

/**
 * Fetch bet archives using the Stake session cookie.
 */
export async function fetchArchiveBucket(id: string): Promise<Archive[]> {
  console.log("[StakeSync] Fetching archives…");

  // Grab the session cookie from Stake
  const cookie = await new Promise<chrome.cookies.Cookie | null>((resolve) => {
    chrome.cookies.get({ url: "https://stake.com", name: "session" }, (c) =>
      resolve(c)
    );
  });

  if (!cookie) {
    throw new Error("No session cookie found. Are you logged into Stake?");
  }

  const token = cookie.value;

  const res = await fetch(`https://stake.com/_api/archive/${id}`, {
    method: "GET",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      cookie: `session=${token}`,
      "x-language": "en",
      "x-access-token": token,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
    credentials: "include", // ensure cookie/session flows with request
  });

  if (!res.ok) {
    throw new Error(`Archive request failed: ${res.status}`);
  }

  console.log("[StakeSync] Archive response:", res);
  const json = await res.json();
  console.log("[StakeSync] Archive bucket:", json);
  return json as Archive[];
}
