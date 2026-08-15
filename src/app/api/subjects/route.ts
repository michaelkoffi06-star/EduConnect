import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assure-toi que ton client Prisma est bien configuré ici

export async function GET() {
  try {
    // On récupère les matières directement depuis la BDD
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' } // Tri alphabétique
    });

    return NextResponse.json(subjects, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération matières :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}