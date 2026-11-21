"use client";

import { useEffect, useRef, useState } from "react";
import { IconPause, IconPlay } from "./icons";

// Extrait audio du chapitre 1 sur l'accueil (§7tervicies) : de vrais enregistrements de la leçon
// (public/lecons/chapitre-01/audio/aNN.mp3), jamais de voix de synthèse. Un seul son à la fois ;
// l'onde ne bouge que pendant la lecture.

export interface AudioWord {
  id: string; // identifiant du fichier (a07…), le même que data-id dans la page du chapitre
  term: string;
  translation: string;
  example: string;
}

export default function AudioSample({ words, audioBase }: { words: AudioWord[]; audioBase: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  // On coupe le son si l'on quitte la page
  useEffect(() => () => audio.current?.pause(), []);

  const toggle = (id: string) => {
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.addEventListener("ended", () => setPlaying(null));
    }
    const a = audio.current;
    if (playing === id) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.pause();
    a.src = `${audioBase}${id}.mp3`;
    setFailed(null);
    setPlaying(id);
    a.play().catch(() => {
      setPlaying(null);
      setFailed(id);
    });
  };

  return (
    <ul className="divide-y divide-line">
      {words.map((w) => {
        const isPlaying = playing === w.id;
        return (
          <li key={w.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => toggle(w.id)}
              aria-pressed={isPlaying}
              aria-label={`${isPlaying ? "Arrêter" : "Écouter"} « ${w.term} »`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700 ${
                isPlaying ? "bg-navy-900 text-gold-300" : "bg-gold-500 text-navy-900 hover:bg-gold-300"
              }`}
            >
              {isPlaying ? <IconPause className="h-4 w-4" /> : <IconPlay className="ml-0.5 h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              {/* La traduction passe à la ligne sur petit écran */}
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-navy-900" lang="en">
                  {w.term}
                </span>
                <span className="text-sm text-gray-600">{w.translation}</span>
              </p>
              <p className="mt-0.5 text-sm italic text-gray-600" lang="en">
                {w.example}
              </p>
              {failed === w.id && <p className="mt-1 text-xs text-red-700">Lecture impossible pour le moment.</p>}
            </div>
            {/* Onde sonore : immobile au repos, animée pendant la lecture */}
            <span aria-hidden="true" className="flex h-6 items-end gap-[3px]">
              {[0, 1, 2, 3].map((b) => (
                <span
                  key={b}
                  className={`w-[3px] origin-bottom rounded-full ${isPlaying ? "animate-sound-bar bg-gold-500" : "bg-line"}`}
                  style={{ height: `${[55, 100, 70, 85][b]}%`, animationDelay: `${b * 120}ms` }}
                />
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
