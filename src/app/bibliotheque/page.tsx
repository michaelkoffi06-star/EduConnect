"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import ScrollReveal from "@/components/ScrollReveal";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "EXERCICE" | "LIEN";
  level: string;
  fileUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
  subject: Subject;
}

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Document",
  VIDEO: "Vidéo",
  EXERCICE: "Exercice",
  LIEN: "Lien",
};

const TYPE_ICONS: Record<string, string> = {
  DOCUMENT: "📄",
  VIDEO: "🎬",
  EXERCICE: "📝",
  LIEN: "🔗",
};

const LEVEL_LABELS: Record<string, string> = {
  PRIMAIRE: "Primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  ALL: "Tous niveaux",
};

export default function Bibliotheque() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const levelOptions = [
    { name: "Tous niveaux", value: "" },
    { name: "Primaire", value: "PRIMAIRE" },
    { name: "Collège", value: "COLLEGE" },
    { name: "Lycée", value: "LYCEE" },
  ];

  const disciplines = [
    { name: "Tous les contenus", slug: "" },
    { name: "Mathematiques", slug: "maths" },
    { name: "Physique-Chimie", slug: "physique-chimie" },
    { name: "SVT", slug: "svt" },
    { name: "Anglais", slug: "anglais" },
    { name: "Francais", slug: "francais" },
    { name: "Histoire-Geographie", slug: "histoire-geo" },
    { name: "Philosophie", slug: "philosophie" },
    { name: "Economie", slug: "economie" },
    { name: "Allemand", slug: "allemand" },
    { name: "Espagnol", slug: "espagnol" },
    { name: "Portugais", slug: "portugais" },
    { name: "Informatique", slug: "informatique" },
  ];

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSubject) params.set("subject", selectedSubject);
        if (selectedLevel) params.set("level", selectedLevel);
        const url = params.toString() ? `/api/resources?${params.toString()}` : "/api/resources";
        const res = await fetch(url);
        if (res.ok) setResources(await res.json());
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [selectedSubject, selectedLevel]);

  const openResource = (r: Resource) => {
    const url = r.fileUrl || r.externalUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white text-[#0d1b3e] font-sans">

      <SiteHeader />

      <section className="bg-[#faf8f2] border-b border-[#eee6d3] py-16 px-4">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">
              Ressources pédagogiques
            </span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-5xl tracking-tight mb-4">
            Bibliothèque EduConnect
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Documents, vidéos, exercices et liens utiles, classés par matière et par niveau.
          </p>
        </ScrollReveal>
      </section>

      <div className="sticky top-[57px] z-40 bg-white/90 backdrop-blur-sm border-b border-[#eee6d3]">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {disciplines.map((dis) => (
              <button
                key={dis.slug === "" ? "all" : dis.slug}
                onClick={() => setSelectedSubject(dis.slug)}
                className={
                  selectedSubject === dis.slug
                    ? "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#0d1b3e] text-white transition"
                    : "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#faf8f2] text-gray-600 border border-[#eee6d3] hover:border-[#c9951a]/60 hover:text-[#0d1b3e] transition"
                }
              >
                {dis.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {levelOptions.map((lvl) => (
              <button
                key={lvl.value === "" ? "all-levels" : lvl.value}
                onClick={() => setSelectedLevel(lvl.value)}
                className={
                  selectedLevel === lvl.value
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border border-[#c9951a] bg-[#c9951a]/10 text-[#8a6510] transition"
                    : "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border border-[#eee6d3] bg-white text-gray-500 hover:border-[#c9951a]/60 hover:text-[#0d1b3e] transition"
                }
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#c9951a] border-t-transparent"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-[#faf8f2] rounded-3xl border border-[#eee6d3]">
            <p className="text-gray-500 text-lg">Aucune ressource dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {resources.map((r, index) => (
              <ScrollReveal key={r.id} delay={Math.min(index * 80, 400)}>
                <div className="flex flex-col bg-white rounded-3xl border border-[#eee6d3] shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#c9951a]/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{TYPE_ICONS[r.type]}</span>
                    <div>
                      <span className="block text-xs font-semibold text-[#8a6510] uppercase tracking-wide">
                        {TYPE_LABELS[r.type]}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-[family-name:var(--font-cinzel)] text-base text-[#0d1b3e] mb-2">
                    {r.title}
                  </h3>

                  {r.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">
                      {r.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="bg-[#c9951a]/12 text-[#8a6510] text-xs px-2.5 py-1 rounded-md font-semibold border border-[#c9951a]/30">
                      {r.subject.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-[#faf8f2] px-2 py-0.5 rounded-md border border-[#eee6d3]">
                      {LEVEL_LABELS[r.level] || r.level}
                    </span>
                  </div>

                  <button
                    onClick={() => openResource(r)}
                    className="mt-auto w-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-105 text-white font-bold py-2.5 rounded-lg text-sm transition"
                  >
                    {r.type === "DOCUMENT" || r.type === "EXERCICE" ? "Télécharger" : "Ouvrir"}
                  </button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
