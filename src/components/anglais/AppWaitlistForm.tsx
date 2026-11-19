"use client";

import { useState } from "react";

// Formulaire « Prévenez-moi à la sortie » de l'application mobile (§7unvicies)
export default function AppWaitlistForm() {
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/anglais/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Inscription impossible. Réessaie.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        C&apos;est noté ! On te prévient le jour de la sortie de l&apos;application.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="app-contact" className="block text-sm font-medium text-[#0d1b3e]">
        Ton email ou ton numéro WhatsApp
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="app-contact"
          required
          maxLength={200}
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="exemple@email.com ou 07 00 00 00 00"
          className="min-w-0 flex-1 rounded-full border border-[#eee6d3] bg-white px-4 py-3 text-sm text-[#0d1b3e] outline-none focus:border-[#c9951a]"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-full bg-[#c9951a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b5851a] disabled:opacity-60"
        >
          {state === "sending" ? "Envoi…" : "Prévenez-moi à la sortie"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="text-xs text-gray-500">
        On t&apos;écrit une seule fois, le jour de la sortie. Ton contact ne sert à rien d&apos;autre (
        <a href="/confidentialite" className="underline">confidentialité</a>).
      </p>
    </form>
  );
}
