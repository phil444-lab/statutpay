import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

function getPeriodDateRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "3m":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function formatDateKey(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${m}`;
}

// ─── GET /api/rapports ────────────────────────────────────────────────
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || "7d";
    const statutFilter = req.query.statut as string | undefined;

    // Condition statut pour les campagnes
    const statutCondition: any = statutFilter && statutFilter !== "tous"
      ? { statut: statutFilter }
      : {};

    // Budget engagé (actif + en_attente)
    const budgetAgg = await prisma.campagne.aggregate({
      where: { annonceurId: userId, deletedAt: null, statut: { in: ["actif", "en_attente"] } },
      _sum: { budget: true },
    });
    const budgetEngage = budgetAgg._sum.budget || 0;

    // Solde du portefeuille
    const portefeuille = await prisma.portefeuille.findUnique({ where: { userId } });

    // Transactions selon période
    const dateSince = getPeriodDateRange(period);
    const dateFilter: any = dateSince ? { createdAt: { gte: dateSince } } : {};

    const transactions = await prisma.transaction.findMany({
      where: {
        portefeuille: { userId },
        statut: "reussi",
        type: "depense",
        ...dateFilter,
      },
      orderBy: { createdAt: "asc" },
    });

    // Grouper par jour pour l'évolution
    const evolutionMap = new Map<string, { date: string; depenses: number; count: number }>();

    if (dateSince) {
      const now = new Date();
      let cursor = new Date(dateSince);
      while (cursor <= now) {
        const key = formatDateKey(cursor);
        evolutionMap.set(key, { date: key, depenses: 0, count: 0 });
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    let totalDepenses = 0;
    for (const tx of transactions) {
      totalDepenses += tx.montant;
      if (dateSince) {
        const key = formatDateKey(tx.createdAt);
        const entry = evolutionMap.get(key);
        if (entry) {
          entry.depenses += tx.montant;
          entry.count += 1;
        }
      }
    }

    const evolution = Array.from(evolutionMap.values());

    // Compter le nombre de campagnes
    const totalCampagnes = await prisma.campagne.count({
      where: { annonceurId: userId, deletedAt: null, ...statutCondition },
    });

    // Ces métriques nécessitent un tracking d'audience (non implémenté)
    const impressions = 0;
    const portee = 0;
    const frequence = 0;
    const cpm = 0;

    res.json({
      kpis: {
        impressions,
        portee,
        frequence,
        cpm,
        budgetEngage,
        solde: portefeuille?.solde || 0,
        depenses: totalDepenses,
      },
      evolution,
    });
  } catch (error) {
    console.error("Erreur rapports:", error);
    res.status(500).json({ message: "Erreur lors du chargement des rapports" });
  }
});

export default router;