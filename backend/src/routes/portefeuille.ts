import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const router = Router();
const prisma = new PrismaClient();

const FEDAPAY_API_KEY = process.env.FEDAPAY_API_KEY || "";
const FEDAPAY_BASE = "https://sandbox-api.fedapay.com/v1";

const fedapayHeaders = () => ({
  Authorization: `Bearer ${FEDAPAY_API_KEY}`,
  "Content-Type": "application/json",
  "X-Version": "1.1.1",
  "X-Source": "StatutPay",
  Accept: "application/json",
});

// Configuration FedaPay pour les Payouts
const fedapayConfig = {
  apiKey: FEDAPAY_API_KEY,
  environment: "sandbox",
};

async function ensurePortefeuille(userId: number) {
  let portefeuille = await prisma.portefeuille.findUnique({ where: { userId } });
  if (!portefeuille) {
    portefeuille = await prisma.portefeuille.create({ data: { userId, solde: 0 } });
  }
  return portefeuille;
}

// ─── GET /api/portefeuille ───────────────────────────────────────────────
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portefeuille = await ensurePortefeuille(req.user!.userId);

    // Mise à jour automatique des statuts basée sur les dates
    const now = new Date();
    await prisma.$transaction([
      prisma.campagne.updateMany({
        where: { annonceurId: req.user!.userId, deletedAt: null, statut: "en_attente", dateDebut: { lte: now } },
        data: { statut: "actif" },
      }),
      prisma.campagne.updateMany({
        where: { annonceurId: req.user!.userId, deletedAt: null, statut: "actif", dateFin: { lt: now } },
        data: { statut: "cloture" },
      }),
    ]);

    // Pagination: 5 transactions par page par défaut
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    // Récupérer les transactions avec pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { portefeuilleId: portefeuille.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: { portefeuilleId: portefeuille.id },
      }),
    ]);

    const depotsMois = await prisma.transaction.aggregate({
      where: {
        portefeuilleId: portefeuille.id,
        type: "depot",
        statut: "reussi",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    });

    const depensesMois = await prisma.transaction.aggregate({
      where: {
        portefeuilleId: portefeuille.id,
        type: "depense",
        statut: "reussi",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    });

    // Nombre de campagnes actives
    const campagnesActives = await prisma.campagne.count({
      where: {
        annonceurId: req.user!.userId,
        statut: "actif",
        deletedAt: null,
      },
    });

    // Budget engagé total (somme des budgets des campagnes actives + en_attente)
    const budgetAgg = await prisma.campagne.aggregate({
      where: {
        annonceurId: req.user!.userId,
        statut: { in: ["actif", "en_attente"] },
        deletedAt: null,
      },
      _sum: { budget: true },
    });

    // Budget engagé actif (uniquement campagnes actives)
    const budgetActifAgg = await prisma.campagne.aggregate({
      where: {
        annonceurId: req.user!.userId,
        statut: "actif",
        deletedAt: null,
      },
      _sum: { budget: true },
    });

    res.json({
      solde: portefeuille.solde,
      depotsMois: depotsMois._sum.montant || 0,
      depensesMois: depensesMois._sum.montant || 0,
      campagnesActives,
      budgetEngage: budgetAgg._sum.budget || 0,
      engageActif: budgetActifAgg._sum.budget || 0,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur portefeuille:", error);
    res.status(500).json({ message: "Erreur lors du chargement du portefeuille" });
  }
});

// ─── POST /api/portefeuille/initier-depot ────────────────────────────────
router.post("/initier-depot", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { montant, description } = req.body;
    if (!montant || montant < 500) {
      return res.status(400).json({ message: "Montant minimum : 500 F" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const createResponse = await axios.post(
      `${FEDAPAY_BASE}/transactions`,
      {
        description: description || `Dépôt de ${montant} F sur le portefeuille`,
        amount: montant,
        currency: { iso: "XOF" },
        callback_url: `${process.env.FRONTEND_URL}/dashboard/annonceur/portefeuille`,
      },
      { headers: fedapayHeaders() }
    );

    const fedapayTransaction = createResponse.data["v1/transaction"];
    console.log("Transaction créée:", fedapayTransaction.id, fedapayTransaction.reference);

    const portefeuille = await ensurePortefeuille(user.id);
    // Stocker l'ID et le statut FedaPay pour reconfirmation future
    await prisma.transaction.create({
      data: {
        portefeuilleId: portefeuille.id,
        type: "depot",
        montant,
        fedapayId: fedapayTransaction.id,
        reference: fedapayTransaction.reference,
        fedapayStatus: fedapayTransaction.status || "pending",
        statut: "en_attente",
        description: description || `Dépôt de ${montant} F`,
      },
    });

    res.json({
      transactionId: fedapayTransaction.id,
      reference: fedapayTransaction.reference,
      token: fedapayTransaction.payment_token,
      url: fedapayTransaction.payment_url,
    });
  } catch (error: any) {
    console.error("=== ERREUR FedaPay ===");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    res.status(500).json({
      message: "Erreur lors de l'initialisation du dépôt",
      detail: error.response?.data || error.message,
    });
  }
});

// ─── POST /api/portefeuille/confirmer-depot ──────────────────────────────
// Confirm via reference (utilisé par le frontend après retour FedaPay)
router.post("/confirmer-depot", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: "Référence manquante" });

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { portefeuille: true },
    });
    if (!transaction) return res.status(404).json({ message: "Transaction introuvable" });
    if (transaction.statut === "reussi") {
      return res.json({ message: "Dépôt déjà confirmé", solde: transaction.portefeuille.solde });
    }

    // Chercher via l'ID FedaPay (plus fiable)
    let fedapayTransaction: any = null;
    if (transaction.fedapayId) {
      try {
        const resp = await axios.get(
          `${FEDAPAY_BASE}/transactions/${transaction.fedapayId}`,
          { headers: fedapayHeaders() }
        );
        fedapayTransaction = resp.data["v1/transaction"] || resp.data;
      } catch {
        // fallback: search par référence
      }
    }

    if (!fedapayTransaction || !fedapayTransaction.status) {
      // Fallback: search par référence
      const resp = await axios.get(
        `${FEDAPAY_BASE}/transactions/search?reference=${encodeURIComponent(reference)}`,
        { headers: fedapayHeaders() }
      );
      const list = resp.data?.["v1/transactions"] || resp.data?.transactions || [];
      fedapayTransaction = Array.isArray(list) ? list[0] : list;
    }

    if (!fedapayTransaction || !fedapayTransaction.status) {
      return res.status(400).json({ message: "Transaction non trouvée chez FedaPay" });
    }

    const statusPaid = ["approved", "transferred"].includes(fedapayTransaction.status);

    if (statusPaid) {
      // Mettre à jour le statut FedaPay et l'ID s'ils manquaient
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            statut: "reussi",
            modePaiement: "mobile_money",
            fedapayId: fedapayTransaction.id || transaction.fedapayId,
            fedapayStatus: fedapayTransaction.status,
          },
        }),
        prisma.portefeuille.update({
          where: { id: transaction.portefeuilleId },
          data: { solde: { increment: transaction.montant } },
        }),
      ]);

      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id: transaction.portefeuilleId },
      });

      res.json({ message: "Dépôt confirmé avec succès", solde: portefeuille?.solde });
    } else {
      await prisma.transaction.updateMany({
        where: { reference },
        data: { statut: "echoue" },
      });
      res.status(400).json({ message: `Paiement non confirmé (statut: ${fedapayTransaction.status})` });
    }
  } catch (error: any) {
    console.error("Erreur confirmation dépôt:", error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de la confirmation du dépôt" });
  }
});

// ─── POST /api/portefeuille/reconfirmer-depot ────────────────────────────
// Reconfirm via fedapayId (utilisé par le bouton "Reconfirmer")
router.post("/reconfirmer-depot", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ message: "ID transaction manquant" });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { portefeuille: true },
    });
    if (!transaction) return res.status(404).json({ message: "Transaction introuvable" });
    if (transaction.portefeuille.userId !== req.user!.userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    if (transaction.statut === "reussi") {
      return res.json({ message: "Dépôt déjà confirmé", solde: transaction.portefeuille.solde });
    }

    // Vérifier via fedapayId
    if (!transaction.fedapayId) {
      return res.status(400).json({ message: "Aucun ID FedaPay pour cette transaction. Le paiement a probablement échoué." });
    }

    const resp = await axios.get(
      `${FEDAPAY_BASE}/transactions/${transaction.fedapayId}`,
      { headers: fedapayHeaders() }
    );
    const fedapayTransaction = resp.data["v1/transaction"] || resp.data;

    if (!fedapayTransaction || !fedapayTransaction.status) {
      return res.status(400).json({ message: "Transaction non trouvée chez FedaPay" });
    }

    const statusPaid = ["approved", "transferred"].includes(fedapayTransaction.status);

    if (statusPaid) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            statut: "reussi", 
            modePaiement: "mobile_money",
            fedapayStatus: fedapayTransaction.status,
          },
        }),
        prisma.portefeuille.update({
          where: { id: transaction.portefeuilleId },
          data: { solde: { increment: transaction.montant } },
        }),
      ]);

      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id: transaction.portefeuilleId },
      });

      res.json({ message: "Dépôt confirmé avec succès", solde: portefeuille?.solde });
    } else {
      // Comparer les statuts
      const statusChanged = transaction.fedapayStatus && transaction.fedapayStatus !== fedapayTransaction.status;
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { fedapayStatus: fedapayTransaction.status },
      });

      if (statusChanged) {
        res.status(400).json({ 
          message: `Paiement non confirmé. Statut FedaPay: ${fedapayTransaction.status}` 
        });
      } else {
        res.status(400).json({ 
          message: "Le paiement n'a pas été effectué ou a été annulé. Le statut n'a pas changé." 
        });
      }
    }
  } catch (error: any) {
    console.error("Erreur reconfirmation dépôt:", error.response?.data || error.message);
    if (error.response?.status === 404) {
      return res.status(400).json({
        message: "Transaction introuvable chez FedaPay. Le paiement a été perdu ou annulé.",
      });
    }
    res.status(500).json({ message: "Erreur lors de la reconfirmation du dépôt" });
  }
});

// ─── POST /api/portefeuille/retrait ──────────────────────────────────────
router.post("/retrait", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { montant, description, telephone } = req.body;
    
    if (!montant || montant <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const portefeuille = await ensurePortefeuille(user.id);

    if (portefeuille.solde < montant) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    // Vérifier que le numéro de téléphone est disponible (obligatoire pour Mobile Money)
    const telephonePayout = telephone || user.telephone;
    if (!telephonePayout) {
      return res.status(400).json({ 
        message: "Numéro de téléphone manquant pour le payout. Veuillez fournir un numéro de téléphone.",
        requiresPhone: true 
      });
    }

    // Créer la transaction de retrait
    const transaction = await prisma.transaction.create({
      data: {
        portefeuilleId: portefeuille.id,
        type: "retrait",
        montant,
        statut: "reussi",
        description: description || `Retrait de ${montant} F`,
      },
    });

    // Déduire le montant du solde
    await prisma.portefeuille.update({
      where: { id: portefeuille.id },
      data: { solde: { decrement: montant } },
    });

    const nouveauSolde = portefeuille.solde - montant;

    // Effectuer le payout (reversement) via FedaPay
    let payoutResult = null;
    let payoutError = null;
    try {
      // Formater le numéro de téléphone au format international
      let phoneNumber = telephonePayout.replace(/\D/g, "");
      // Ajouter le + si absent
      if (!phoneNumber.startsWith("+")) {
        phoneNumber = `+${phoneNumber}`;
      }

      console.log("=== TENTATIVE DE PAYOUT FEDAPAY ===");
      console.log("Numéro formaté:", phoneNumber);

      // Créer le payout via l'API REST FedaPay avec le format correct
      const payoutData = {
        amount: montant,
        currency: { iso: "XOF" },
        description: description || `Retrait de ${montant} F`,
        mode: "mtn_open", // FedaPay détectera l'opérateur automatiquement
        customer: {
          firstname: user.prenoms || "Client",
          lastname: user.nom || "StatutPay",
          email: user.email,
          phone_number: {
            number: phoneNumber,
            country: "bj",
          },
        },
      };

      console.log("Données payout:", JSON.stringify(payoutData, null, 2));

      const payoutResponse = await axios.post(
        `${FEDAPAY_BASE}/payouts`,
        payoutData,
        { headers: fedapayHeaders() }
      );

      console.log("✓ Payout FedaPay créé:", JSON.stringify(payoutResponse.data, null, 2));

      const payoutId = payoutResponse.data?.payout?.id || payoutResponse.data?.id;
      
      // Envoyer le payout immédiatement
      if (payoutId) {
        console.log(`Envoi du payout ${payoutId}...`);
        const sendResult = await axios.post(
          `${FEDAPAY_BASE}/payouts/${payoutId}/send`,
          {},
          { headers: fedapayHeaders() }
        );
        console.log("✓ Payout envoyé:", JSON.stringify(sendResult.data, null, 2));
        payoutResult = { ...payoutResponse.data, send: sendResult.data };
      }
    } catch (error: any) {
      payoutError = error;
      console.error("=== ERREUR Payout FedaPay ===");
      console.error("Status:", error.response?.status);
      console.error("Data:", JSON.stringify(error.response?.data, null, 2));
      console.error("Message:", error.message);
      
      // Message d'erreur plus détaillé pour l'utilisateur
      let errorMessage = "Erreur lors du payout FedaPay";
      if (error.response?.status === 403) {
        errorMessage = "Payout non autorisé. Votre clé API sandbox n'a pas les permissions pour les payouts. Contactez FedaPay pour activer cette fonctionnalité ou utilisez un traitement manuel.";
      }
      
      // Le retrait reste effectué même si le payout échoue
    }

    // Si le payout a échoué, retourner une réponse avec l'erreur
    if (payoutError) {
      let errorMessage = "Retrait effectué avec succès (payout en attente de traitement manuel)";
      if (payoutError.response?.status === 403) {
        errorMessage = "Retrait effectué. Le payout automatique nécessite une clé API avec permissions payouts. Contactez FedaPay pour activer cette fonctionnalité.";
      }
      
      return res.json({ 
        message: errorMessage,
        solde: nouveauSolde,
        transaction,
        payoutError: {
          status: payoutError.response?.status,
          message: payoutError.response?.data?.message || payoutError.message,
          data: payoutError.response?.data
        }
      });
    }

    res.json({ 
      message: "Retrait effectué avec succès", 
      solde: nouveauSolde,
      transaction,
      payout: payoutResult
    });
  } catch (error: any) {
    console.error("Erreur retrait:", error);
    res.status(500).json({ message: "Erreur lors du retrait" });
  }
});

// ─── POST /api/portefeuille/webhook ──────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;
    if (event.event_name === "transaction.completed" && event.data?.id) {
      const fedapayId = event.data.id;

      const resp = await axios.get(
        `${FEDAPAY_BASE}/transactions/${fedapayId}`,
        { headers: fedapayHeaders() }
      );
      const fedapayTransaction = resp.data["v1/transaction"] || resp.data;
      const statusPaid = ["approved", "transferred"].includes(fedapayTransaction.status);

      if (statusPaid) {
        const transaction = await prisma.transaction.findFirst({ where: { fedapayId } });
        if (transaction && transaction.statut !== "reussi") {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { 
                statut: "reussi", 
                modePaiement: "mobile_money",
                fedapayStatus: fedapayTransaction.status,
              },
            }),
            prisma.portefeuille.update({
              where: { id: transaction.portefeuilleId },
              data: { solde: { increment: transaction.montant } },
            }),
          ]);
        }
      }
    }
    res.json({ message: "Webhook reçu" });
  } catch (error) {
    console.error("Erreur webhook:", error);
    res.status(500).json({ message: "Erreur webhook" });
  }
});

// ─── GET /api/portefeuille/test-fedapay ──────────────────────────────────
// Endpoint de test pour vérifier la connexion FedaPay
router.get("/test-fedapay", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log("=== TEST CONNEXION FEDAPAY ===");
    console.log("API Key:", FEDAPAY_API_KEY.substring(0, 15) + "...");
    
    // Test 1: Vérifier le compte
    const accountResp = await axios.get(
      `${FEDAPAY_BASE}/account`,
      { headers: fedapayHeaders() }
    );
    console.log("✓ Compte FedaPay:", accountResp.data);

    // Test 2: Créer un customer de test
    const testCustomer = {
      firstname: "Test",
      lastname: "User",
      email: `test${Date.now()}@example.com`,
      phone_number: {
        number: "+22961000022",
        country: "bj",
      },
    };

    const customerResp = await axios.post(
      `${FEDAPAY_BASE}/customers`,
      testCustomer,
      { headers: fedapayHeaders() }
    );
    console.log("✓ Customer de test créé:", customerResp.data);

    res.json({
      message: "Connexion FedaPay OK",
      account: accountResp.data,
      customer: customerResp.data,
    });
  } catch (error: any) {
    console.error("=== ERREUR TEST FEDAPAY ===");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Message:", error.message);
    
    res.status(500).json({
      message: "Erreur de connexion à FedaPay",
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
    });
  }
});

export default router;
