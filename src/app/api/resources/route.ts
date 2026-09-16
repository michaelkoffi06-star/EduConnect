import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');
    const level = searchParams.get('level');

    const resources = await prisma.resource.findMany({
      where: {
        ...(subjectSlug && {
          subject: { slug: subjectSlug.toLowerCase() },
        }),
        ...((level === 'PRIMAIRE' || level === 'COLLEGE' || level === 'LYCEE') && {
          level: { in: [level, 'ALL'] },
        }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        level: true,
        fileUrl: true,
        externalUrl: true,
        createdAt: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Resources (public):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
