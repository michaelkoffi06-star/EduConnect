import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SujetClient from "./SujetClient";

// Un sujet du forum. Les métadonnées (titre de la question) ne sont renseignées que pour
// les sujets publics de l'espace « Questions » ; la salle des profs reste non indexée.

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: { title: true, body: true, space: true, hidden: true, subject: { select: { name: true } } },
    });
    if (!thread || thread.hidden || thread.space !== "QUESTIONS") {
      return { title: "Forum", robots: { index: false } };
    }
    return {
      title: `${thread.title} — Forum${thread.subject ? ` ${thread.subject.name}` : ""}`,
      description: thread.body.slice(0, 160),
      alternates: { canonical: `/forum/${id}` },
    };
  } catch {
    return { title: "Forum" };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SujetClient id={id} />;
}
