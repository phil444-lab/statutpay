import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const [pays, professions, categoriesCiblage, typesMedia, categoriesCampagne] = await Promise.all([
    prisma.pays.findMany({
      orderBy: { label: "asc" },
      include: { localites: { orderBy: { label: "asc" } } },
    }),
    prisma.profession.findMany({ orderBy: { label: "asc" } }),
    prisma.categorieCiblage.findMany({ orderBy: { label: "asc" } }),
    prisma.typeMedia.findMany({ orderBy: { label: "asc" } }),
    prisma.categorieCampagne.findMany({ orderBy: { label: "asc" } }),
  ]);

  return res.json({ pays, professions, categoriesCiblage, typesMedia, categoriesCampagne });
});

export default router;
