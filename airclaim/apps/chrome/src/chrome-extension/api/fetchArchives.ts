import { buildBetArchiveQuery } from "./gql/buildBetArchiveQuery";

export interface ArchiveFetchResponse {
  data: {
    user: {
      betArchiveList: Archive[];
    };
  };
}
export interface Archive {
  id: string;
  date: string;
  count: number;
}

export type BackgroundMessage = { type: "SYNC_ARCHIVES" };

export interface BackgroundResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Fetch bet archives using the Stake session cookie.
 */
export async function fetchArchives(): Promise<ArchiveFetchResponse> {
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
  const cookieHeader = `session=${cookie.value}`;

  const reqBody = buildBetArchiveQuery();

  const res = await fetch("https://stake.com/_api/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-language": "en",
      "x-operation-name": "BetArchive",
      "x-operation-type": "query",
      "x-access-token": token,
      cookie: `${cookieHeader}`,
    },
    body: JSON.stringify(reqBody),
  });

  console.log("[StakeSync] Response:", res);

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  console.log("[StakeSync] Archives:", json);
  return json as ArchiveFetchResponse;
}
