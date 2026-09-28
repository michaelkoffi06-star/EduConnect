import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicResourceSelect, toPublicResource, type PublicResourceRow } from "@/lib/library";
import { findResourceByKey } from "@/lib/library-server";
import type { LibResource } from "@/components/bibliotheque/shared";
import ClasseurClient from "./ClasseurClient";

// Page d'une ressource : elle s'ouvre dans son classeur (chapitre), avec les autres
// documents du chapitre en onglets. Rendue côté serveur pour le référencement.

export const dynamic = "force-dynamic";

const TYPE_WORDS: Record<string, string> = {
  DOCUMENT: "Cours",
  EXERCICE: "Exercices",
  VIDEO: "Vidéo",
  LIEN: "Ressource en ligne",
};

const load = cache(async (key: string) => {
  const resource = await findResourceByKey(key);
  if (!resource) return null;
  const siblings = resource.chapter
    ? await prisma.resource.findMany({
        where: { chapterId: resource.chapter.id },
        select: publicResourceSelect,
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })
    : [resource];
  // Passage en JSON : dates en chaînes, comme dans l'API publique
  const serialize = (r: PublicResourceRow) => JSON.parse(JSON.stringify(toPublicResource(r))) as LibResource;
  return { resource: serialize(resource), siblings: siblings.map(serialize) };
});

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const data = await load(key);
  if (!data) return { title: "Ressource introuvable" };
  const r = data.resource;
  const where = r.chapter ? `${r.chapter.title}${r.chapter.classe ? ` (${r.chapter.classe})` : ""}` : r.subject.name;
  const title = `${r.title} — ${TYPE_WORDS[r.type]} de ${r.subject.name}`;
  const description =
    r.description ||
    `${TYPE_WORDS[r.type]} gratuit de ${r.subject.name} — ${where}. À lire en ligne ou à télécharger sur la bibliothèque EduConnect.`;
  return {
    title,
    description,
    alternates: { canonical: `/bibliotheque/${r.urlKey}` },
    openGraph: { title, description, url: `/bibliotheque/${r.urlKey}`, type: "article" },
  };
}

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const data = await load(key);
  if (!data) notFound();

  // Une ancienne URL par id redirige vers l'URL lisible (slug) quand elle existe
  if (data.resource.slug && decodeURIComponent(key) !== data.resource.slug) {
    permanentRedirect(`/bibliotheque/${data.resource.slug}`);
  }

  return <ClasseurClient initialId={data.resource.id} siblings={data.siblings} />;
}
