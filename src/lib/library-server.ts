import { prisma } from '@/lib/prisma';
import { publicResourceSelect } from '@/lib/library';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Retrouve une ressource à partir de la clé présente dans l'URL : son slug (ressources v2)
// ou son id (ressources créées avant l'ajout des slugs).
export async function findResourceByKey(key: string) {
  const decoded = decodeURIComponent(key);
  return prisma.resource.findFirst({
    where: UUID_RE.test(decoded) ? { OR: [{ id: decoded }, { slug: decoded }] } : { slug: decoded },
    select: publicResourceSelect,
  });
}

// Identifiant (id) seulement, pour les routes qui n'ont besoin que de mettre à jour un compteur.
export async function findResourceIdByKey(key: string) {
  const decoded = decodeURIComponent(key);
  const r = await prisma.resource.findFirst({
    where: UUID_RE.test(decoded) ? { OR: [{ id: decoded }, { slug: decoded }] } : { slug: decoded },
    select: { id: true, slug: true, title: true, fileUrl: true },
  });
  return r;
}
