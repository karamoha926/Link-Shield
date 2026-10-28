"use client";

import { useState } from "react";

type AnalysisResult =
  | { status: "threat"; threatTypes: string[] }
  | { status: "clean" }
  | { status: "unknown"; message: string };

const THREAT_LABELS: Record<string, string> = {
  SOCIAL_ENGINEERING: "Hameçonnage (phishing)",
  MALWARE: "Logiciel malveillant",
  UNWANTED_SOFTWARE: "Logiciel indésirable",
};

function validateUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Veuillez coller un lien à analyser.";
  }
  if (trimmed.length > 2048) {
    return "Ce lien est trop long pour être analysé.";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Ce lien n'est pas valide. Exemple attendu : https://exemple.com";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Seuls les liens commençant par http:// ou https:// sont acceptés.";
  }

  return null;
}

export default function LinkScanner() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    const validationError = validateUrl(url);
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error("Réponse du serveur invalide");
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
    } catch {
      setResult({
        status: "unknown",
        message:
          "Le lien n'a pas pu être vérifié correctement. Le service d'analyse est peut-être indisponible. Réessayez plus tard.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label htmlFor="url" className="block text-sm font-medium">
          Lien à analyser
        </label>
        <input
          id="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemple.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-[#0b1a33] focus:ring-2 focus:ring-[#0b1a33]/20"
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1a33] px-4 py-3 font-semibold text-white transition hover:bg-[#13294d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading ? "Analyse en cours..." : "Analyser le lien"}
        </button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: AnalysisResult }) {
  if (result.status === "threat") {
    return (
      <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-5 text-red-900">
        <p className="text-lg font-bold">⚠️ Risque élevé</p>
        <p className="mt-2">
          Ce lien est signalé comme potentiellement dangereux. Par prudence, ne
          poursuivez pas vers ce lien.
        </p>
        <p className="mt-3 text-sm font-semibold">Catégories signalées :</p>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {result.threatTypes.map((type) => (
            <li key={type}>{THREAT_LABELS[type] ?? type}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-red-800">
          Cette protection n&apos;est pas parfaite : un avertissement signale un
          risque possible, sans certitude absolue.
        </p>
        <p className="mt-1 text-xs text-red-800">
          Advisory provided by Google
        </p>
      </div>
    );
  }

  if (result.status === "clean") {
    return (
      <div className="mt-8 rounded-lg border border-slate-300 bg-white p-5">
        <p className="text-lg font-bold">Aucun signalement détecté</p>
        <p className="mt-2 text-sm text-slate-600">
          Cela ne garantit pas que le site est sûr. Restez prudent : ne saisissez
          pas d&apos;informations sensibles sur un site que vous ne connaissez
          pas.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900">
      <p className="text-lg font-bold">❓ Indéterminé</p>
      <p className="mt-2 text-sm">{result.message}</p>
    </div>
  );
}