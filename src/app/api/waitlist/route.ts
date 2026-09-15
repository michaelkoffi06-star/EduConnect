import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, subjectId, subjectSlug } = await req.json();

    if (!email || (!subjectId && !subjectSlug)) {
      return NextResponse.json(
        { error: "Email et matière requis." },
        { status: 400 }
      );
    }

    let resolvedSubjectId = subjectId as string | undefined;

    if (!resolvedSubjectId && subjectSlug) {
      const subject = await prisma.subject.findUnique({
        where: { slug: subjectSlug },
      });
      if (!subject) {
        return NextResponse.json(
          { error: "Matière introuvable." },
          { status: 404 }
        );
      }
      resolvedSubjectId = subject.id;
    }

    const entry = await prisma.waitlistEntry.create({
      data: { email, subjectId: resolvedSubjectId! },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Erreur waitlist:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
