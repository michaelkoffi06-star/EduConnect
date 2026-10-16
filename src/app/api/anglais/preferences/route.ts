import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { cleanText } from '@/lib/english';

// PATCH /api/anglais/preferences — emails « nouveautés » et études/métier (§7novodecies)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const data: { englishNewsOptIn?: boolean; studyField?: string } = {};
    if (typeof body?.newsOptIn === 'boolean') data.englishNewsOptIn = body.newsOptIn;
    if (typeof body?.studyField === 'string') {
      const studyField = cleanText(body.studyField, 80);
      if (!studyField) return NextResponse.json({ error: 'Indique tes études ou ton métier.' }, { status: 400 });
      data.studyField = studyField;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });

    await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur préférences anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
