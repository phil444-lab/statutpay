import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import prisma from "../lib/prisma";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/campagnes/",
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".webm"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Mise à jour automatique des statuts basée sur les dates
async function autoUpdateStatuts(userId: number) {
  const now = new Date();
  await prisma.$transaction([
    prisma.campagne.updateMany({
      where: { annonceurId: userId, deletedAt: null, statut: "en_attente", dateDebut: { lte: now } },
      data: { statut: "actif" },
    }),
    prisma.campagne.updateMany({
      where: { annonceurId: userId, deletedAt: null, statut: "actif", dateFin: { lt: now } },
      data: { statut: "cloture" },
    }),
  ]);
}

// GET /api/campagnes — liste avec filtres
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  await autoUpdateStatuts(req.user!.userId);

  const { statut, categorieId, dateDebut, dateFin, search } = req.query as Record<string, string>;

  const campagnes = await prisma.campagne.findMany({
    where: {
      annonceurId: req.user!.userId,
      deletedAt: null,
      ...(statut ? { statut: statut as any } : {}),
      ...(categorieId ? { categorieId: Number(categorieId) } : {}),
      ...(search ? { nom: { contains: search } } : {}),
      ...(dateDebut || dateFin
        ? {
            AND: [
              ...(dateDebut ? [{ dateFin: { gte: new Date(dateDebut) } }] : []),
              ...(dateFin ? [{ dateDebut: { lte: new Date(dateFin) } }] : []),
            ],
          }
        : {}),
    },
    include: {
      pays: true,
      categorie: true,
      typeMedia: true,
      localites: { include: { localite: true } },
      professions: { include: { profession: true } },
      categoriesCiblage: { include: { categorieCiblage: true } },
      medias: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(campagnes);
});

// POST /api/campagnes — création
router.post("/", authMiddleware, upload.single("media"), async (req: AuthRequest, res: Response) => {
  const {
    nom, description, dateDebut, dateFin, heureDiffusion,
    budget, ageMin, ageMax, legende,
    paysId, typeMediaId, categorieId,
    localiteIds, professionIds, categorieCiblageIds,
  } = req.body;

  if (!nom || !dateDebut || !dateFin || !heureDiffusion || !budget)
    return res.status(400).json({ message: "Champs obligatoires manquants" });

  const parseIds = (val: string | string[] | undefined): number[] => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.map(Number).filter(Boolean);
  };

  const campagne = await prisma.campagne.create({
    data: {
      nom,
      description: description || null,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      heureDiffusion,
      budget: Number(budget),
      ageMin: ageMin ? Number(ageMin) : 18,
      ageMax: ageMax ? Number(ageMax) : 99,
      legende: legende || null,
      annonceurId: req.user!.userId,
      paysId: paysId ? Number(paysId) : null,
      typeMediaId: typeMediaId ? Number(typeMediaId) : null,
      categorieId: categorieId ? Number(categorieId) : null,
      localites: {
        create: parseIds(localiteIds).map((id) => ({ localiteId: id })),
      },
      professions: {
        create: parseIds(professionIds).map((id) => ({ professionId: id })),
      },
      categoriesCiblage: {
        create: parseIds(categorieCiblageIds).map((id) => ({ categorieCiblageId: id })),
      },
      ...(req.file
        ? {
            medias: {
              create: [{ path: req.file.path, mimetype: req.file.mimetype }],
            },
          }
        : {}),
    },
    include: {
      pays: true,
      categorie: true,
      typeMedia: true,
      medias: true,
    },
  });

  return res.status(201).json(campagne);
});

// PUT /api/campagnes/:id — modification
router.put("/:id", authMiddleware, upload.single("media"), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const campagne = await prisma.campagne.findFirst({
    where: { id, annonceurId: req.user!.userId, deletedAt: null },
  });
  if (!campagne) return res.status(404).json({ message: "Campagne introuvable" });

  const {
    nom, description, dateDebut, dateFin, heureDiffusion,
    legende, paysId, typeMediaId, categorieId,
    localiteIds, professionIds, categorieCiblageIds, ageMin, ageMax,
  } = req.body;

  const parseIds = (val: string | string[] | undefined): number[] => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.map(Number).filter(Boolean);
  };

  const now = new Date();
  const dateDebutActuelle = new Date(campagne.dateDebut);
  const dateDebutAtteinte = dateDebutActuelle <= now;

  await prisma.$transaction([
    prisma.campagneLocalite.deleteMany({ where: { campagneId: id } }),
    prisma.campagneProfession.deleteMany({ where: { campagneId: id } }),
    prisma.campagneCategorieCiblage.deleteMany({ where: { campagneId: id } }),
  ]);

  const updated = await prisma.campagne.update({
    where: { id },
    data: {
      nom: nom ?? campagne.nom,
      description: description ?? campagne.description,
      legende: legende ?? campagne.legende,
      paysId: paysId ? Number(paysId) : campagne.paysId,
      typeMediaId: typeMediaId ? Number(typeMediaId) : campagne.typeMediaId,
      categorieId: categorieId ? Number(categorieId) : campagne.categorieId,
      ageMin: ageMin ? Number(ageMin) : campagne.ageMin,
      ageMax: ageMax ? Number(ageMax) : campagne.ageMax,
      ...(!dateDebutAtteinte && dateDebut ? { dateDebut: new Date(dateDebut) } : {}),
      ...(!dateDebutAtteinte && dateFin ? { dateFin: new Date(dateFin) } : {}),
      ...(!dateDebutAtteinte && heureDiffusion ? { heureDiffusion } : {}),
      localites: { create: parseIds(localiteIds).map((i) => ({ localiteId: i })) },
      professions: { create: parseIds(professionIds).map((i) => ({ professionId: i })) },
      categoriesCiblage: { create: parseIds(categorieCiblageIds).map((i) => ({ categorieCiblageId: i })) },
      ...(req.file ? { medias: { create: [{ path: req.file.path, mimetype: req.file.mimetype }] } } : {}),
    },
    include: { pays: true, categorie: true, typeMedia: true, medias: true },
  });

  return res.json(updated);
});

// GET /api/campagnes/:id — détail
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const campagne = await prisma.campagne.findFirst({
    where: { id, annonceurId: req.user!.userId, deletedAt: null },
    include: {
      pays: true,
      categorie: true,
      typeMedia: true,
      localites: { include: { localite: true } },
      professions: { include: { profession: true } },
      categoriesCiblage: { include: { categorieCiblage: true } },
      medias: true,
    },
  });
  if (!campagne) return res.status(404).json({ message: "Campagne introuvable" });
  return res.json(campagne);
});

// DELETE /api/campagnes/:id — soft delete
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const campagne = await prisma.campagne.findFirst({
    where: { id, annonceurId: req.user!.userId, deletedAt: null },
  });
  if (!campagne) return res.status(404).json({ message: "Campagne introuvable" });

  await prisma.campagne.update({ where: { id }, data: { deletedAt: new Date() } });
  return res.json({ message: "Campagne supprimée" });
});

export default router;
