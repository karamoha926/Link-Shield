const THREAT_TYPES = ["SOCIAL_ENGINEERING", "MALWARE", "UNWANTED_SOFTWARE"];
const WEB_RISK_ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";

const MAX_REQUESTS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

type Analysis =
  | { status: "threat"; threatTypes: string[] }
  | { status: "clean" }
  | { status: "unknown"; message: string };

function reply(body: Analysis) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

function unknown(message: string) {
  return reply({ status: "unknown", message });
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(clientId) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestLog.set(clientId, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(clientId, recent);

  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((time) => now - time >= WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }
  return false;
}

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const clientId =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  if (isRateLimited(clientId)) {
    return unknown(
      "Trop de demandes en peu de temps. Patientez une minute avant de réessayer.",
    );
  }

  let url: unknown;
  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return unknown("La demande envoyée au serveur est invalide.");
  }

  if (!isValidHttpUrl(url)) {
    return unknown(
      "Ce lien n'est pas valide. Seuls les liens http:// et https:// sont acceptés.",
    );
  }

  const apiKey = process.env.WEB_RISK_API_KEY;
  if (!apiKey) {
    console.error("WEB_RISK_API_KEY est absente de .env.local");
    return unknown(
      "Le service n'est pas configuré correctement. Le lien n'a pas pu être vérifié.",
    );
  }

  const params = new URLSearchParams();
  for (const type of THREAT_TYPES) {
    params.append("threatTypes", type);
  }
  params.append("uri", url);

  try {
    const response = await fetch(`${WEB_RISK_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (response.status === 429) {
      return unknown(
        "Le quota du service d'analyse est atteint. Réessayez plus tard.",
      );
    }

        if (!response.ok) {
      let details = "";
      try {
        const errorBody = (await response.json()) as {
          error?: { status?: string; message?: string };
        };
        details = `${errorBody.error?.status ?? ""} - ${errorBody.error?.message ?? ""}`;
      } catch {
        details = "(pas de détail fourni)";
      }
      console.error(
        `Web Risk a répondu avec le code ${response.status} ${details}`,
      );
      return unknown(
        "Le service d'analyse a rencontré un problème. Le lien n'a pas pu être vérifié.",
      );
    }

    const data = (await response.json()) as {
      threat?: { threatTypes?: string[] };
    };
    const threatTypes = data.threat?.threatTypes ?? [];

    if (threatTypes.length > 0) {
      return reply({ status: "threat", threatTypes });
    }
    return reply({ status: "clean" });
  } catch {
    console.error("Impossible de joindre Google Web Risk");
    return unknown(
      "Le service d'analyse est injoignable. Le lien n'a pas pu être vérifié.",
    );
  }
}