import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

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

function getPeriodDateRange(period: string): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── GET /api/dashboard ────────────────────────────────────────────────
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || "30d";

    // Mise à jour automatique des statuts
    await autoUpdateStatuts(userId);

    // Compter les campagnes par statut
    const [actif, en_attente, cloture, rejete] = await Promise.all([
      prisma.campagne.count({ where: { annonceurId: userId, deletedAt: null, statut: "actif" } }),
      prisma.campagne.count({ where: { annonceurId: userId, deletedAt: null, statut: "en_attente" } }),
      prisma.campagne.count({ where: { annonceurId: userId, deletedAt: null, statut: "cloture" } }),
      prisma.campagne.count({ where: { annonceurId: userId, deletedAt: null, statut: "rejete" } }),
    ]);

    // Budget total engagé (actif + en_attente)
    const budgetAgg = await prisma.campagne.aggregate({
      where: { annonceurId: userId, deletedAt: null, statut: { in: ["actif", "en_attente"] } },
      _sum: { budget: true },
    });

    // Solde du portefeuille
    const portefeuille = await prisma.portefeuille.findUnique({ where: { userId } });

    // Campagnes récentes (5 dernières)
    const campagnes = await prisma.campagne.findMany({
      where: { annonceurId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        pays: true,
        categorie: true,
        typeMedia: true,
      },
    });

    // Dépenses du mois en cours
    const depensesMoisAgg = await prisma.transaction.aggregate({
      where: {
        portefeuille: { userId },
        type: "depense",
        statut: "reussi",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    });

    // Dépôts du mois en cours
    const depotsMoisAgg = await prisma.transaction.aggregate({
      where: {
        portefeuille: { userId },
        type: "depot",
        statut: "reussi",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    });

    // Données d'évolution groupées par jour selon la période
    const dateSince = getPeriodDateRange(period);
    const transactions = await prisma.transaction.findMany({
      where: {
        portefeuille: { userId },
        statut: "reussi",
        createdAt: { gte: dateSince },
      },
      orderBy: { createdAt: "asc" },
    });

    // Grouper par jour
    const evolutionMap = new Map<string, { depenses: number; depots: number }>();
    
    // Initialiser tous les jours de la période
    const now = new Date();
    let cursor = new Date(dateSince);
    while (cursor <= now) {
      const key = formatDateKey(cursor);
      evolutionMap.set(key, { depenses: 0, depots: 0 });
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }

    // Remplir avec les transactions
    for (const tx of transactions) {
      const key = formatDateKey(tx.createdAt);
      const entry = evolutionMap.get(key);
      if (entry) {
        if (tx.type === "depense") entry.depenses += tx.montant;
        else if (tx.type === "depot") entry.depots += tx.montant;
      }
    }

    // Construire le tableau d'évolution
    const evolution = Array.from(evolutionMap.entries()).map(([date, data]) => ({
      date,
      depenses: data.depenses,
      depots: data.depots,
      budget: data.depenses, // alias pour la métrique budget
    }));

    res.json({
      stats: {
        actif,
        en_attente,
        cloture,
        rejete,
      },
      budgetEngage: budgetAgg._sum.budget || 0,
      solde: portefeuille?.solde || 0,
      depensesMois: depensesMoisAgg._sum.montant || 0,
      depotsMois: depotsMoisAgg._sum.montant || 0,
      campagnes: campagnes.map((c) => ({
        id: c.id,
        nom: c.nom,
        statut: c.statut,
        budget: c.budget,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin,
        categorie: c.categorie?.label || null,
      })),
      evolution,
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);
    res.status(500).json({ message: "Erreur lors du chargement du dashboard" });
  }
});

export default router;