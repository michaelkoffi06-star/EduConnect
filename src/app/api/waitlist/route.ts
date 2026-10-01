import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, HOUR } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/waitlist — inscription à la liste d'attente d'une matière (route publique).
// Nombre d'inscriptions limité par IP (voir §7sedecies).
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "waitlist", 10, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subjectId = typeof body.subjectId === "string" ? body.subjectId : undefined;
    const subjectSlug = typeof body.subjectSlug === "string" ? body.subjectSlug : undefined;

    if (!email || (!subjectId && !subjectSlug)) {
      return NextResponse.json({ error: "Email et matière requis." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const subject = subjectId
      ? await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } })
      : await prisma.subject.findUnique({ where: { slug: subjectSlug }, select: { id: true } });
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable." }, { status: 404 });
    }

    await prisma.waitlistEntry.create({
      data: { email, subjectId: subject.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur waitlist:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
