import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import nodemailer from "nodemailer";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

const FEDAPAY_API_KEY = process.env.FEDAPAY_API_KEY || "";
const FEDAPAY_BASE = "https://sandbox-api.fedapay.com/v1";

// Configuration Nodemailer pour les emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Fonction helper pour envoyer un email
async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"StatutPay" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../../../public/logo.png"),
          cid: "logo",
        },
      ],
    });
  } catch (error) {
    console.error("Erreur envoi email:", error);
  }
}

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

      // Envoyer l'email de confirmation de dépôt
      const user = await prisma.user.findUnique({ where: { id: transaction.portefeuille.userId } });
      if (user) {
        const depositHtml = getDepositEmailHtml(transaction.montant, transaction.reference!, portefeuille!.solde);
        await sendEmail(user.email, "Dépôt confirmé ! ✅", depositHtml);
      }

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

      // Envoyer l'email de confirmation de dépôt
      const user = await prisma.user.findUnique({ where: { id: transaction.portefeuille.userId } });
      if (user) {
        const depositHtml = getDepositEmailHtml(transaction.montant, transaction.reference || `DEP-${Date.now()}`, portefeuille!.solde);
        await sendEmail(user.email, "Dépôt confirmé ! ✅", depositHtml);
      }

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

    // Envoyer l'email de confirmation de retrait
    const withdrawalHtml = getWithdrawalEmailHtml(montant, transaction.reference || `RET-${Date.now()}`, nouveauSolde, telephonePayout);
    await sendEmail(user.email, "Retrait effectué ! 💸", withdrawalHtml);

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

// ─── Template d'email de confirmation de dépôt ──────────────────────────
function getDepositEmailHtml(montant: number, reference: string, solde: number): string {
  const date = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Confirmation de dépôt - StatutPay</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f3; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f3; padding: 30px 0;">
  <tr>
    <td align="center">

      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <!-- ============ HEADER ============ -->
        <tr>
          <td style="background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); padding: 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <img src="cid:logo" alt="StatutPay" style="max-width:150px; height:auto; display:block;" />
                </td>
                <td valign="middle" align="right">
                  <p style="color:#ffffff; font-size:13px; letter-spacing:1px; text-transform:uppercase; margin:0 0 4px 0; opacity:0.85;">Dépôt</p>
                  <p style="color:#ffffff; font-size:18px; font-weight:700; margin:0;">Confirmé ✅</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ STATUT ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#d4edda; border-radius:20px; padding:6px 16px;">
                  <span style="color:#155724; font-size:13px; font-weight:700;">&#10003; RECU</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ INTRO ============ -->
        <tr>
          <td style="padding: 20px 40px 0 40px;">
            <p style="color:#333333; font-size:15px; line-height:1.6; margin:0;">
              Bonjour,
            </p>
            <p style="color:#555555; font-size:15px; line-height:1.7; margin:12px 0 0 0;">
              Excellente nouvelle ! Votre dépôt sur votre portefeuille <strong>StatutPay</strong> a été confirmé avec succès. Les fonds sont maintenant disponibles.
            </p>
          </td>
        </tr>

        <!-- ============ RÉCAPITULATIF ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-bottom:2px solid #4c075b; padding:0 0 10px 0;">
                  <span style="color:#4c075b; font-size:12px; font-weight:700; text-transform:uppercase;">Description</span>
                </td>
                <td style="border-bottom:2px solid #4c075b; padding:0 0 10px 0;" align="right">
                  <span style="color:#4c075b; font-size:12px; font-weight:700; text-transform:uppercase;">Montant</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0; border-bottom:1px solid #f0f0f0;">
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0 0 3px 0;">Dépôt portefeuille annonceur</p>
                  <p style="color:#999999; font-size:12px; margin:0;">Crédit disponible pour campagnes publicitaires</p>
                </td>
                <td style="padding:16px 0; border-bottom:1px solid #f0f0f0;" align="right" valign="top">
                  <span style="color:#28a745; font-size:16px; font-weight:700;">+ ${montant.toLocaleString('fr-FR')} F</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ DATE / REF ============ -->
        <tr>
          <td style="padding: 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #eeeeee;">
              <tr>
                <td style="padding:14px 0;">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Date</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">${date}</p>
                </td>
                <td style="padding:14px 0;">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Référence</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">${reference}</p>
                </td>
                <td style="padding:14px 0;" align="right">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Méthode</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">Mobile Money</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ NOUVEAU SOLDE ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8f4fa 0%, #f0e8f5 100%); border-radius:8px;">
              <tr>
                <td style="padding:18px 20px;">
                  <span style="color:#555555; font-size:13px;">Nouveau solde du portefeuille</span>
                </td>
                <td style="padding:18px 20px;" align="right">
                  <span style="color:#4c075b; font-size:18px; font-weight:700;">${solde.toLocaleString('fr-FR')} F</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ CONFIRMATION ============ -->
        <tr>
          <td style="padding: 20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#d4edda; border-radius:8px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="color:#155724; font-size:13px; line-height:1.5; margin:0;">
                    <strong>✓ Confirmation :</strong> Les fonds sont disponibles sur votre portefeuille. Vous pouvez les utiliser pour créer des campagnes publicitaires.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ CTA ============ -->
        <tr>
          <td align="center" style="padding: 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px; background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%);">
                  <a href="${process.env.FRONTEND_URL}/dashboard/annonceur/portefeuille"
                     style="display:inline-block; padding:14px 36px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                    Voir mon portefeuille
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ MENTIONS ============ -->
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <p style="color:#999999; font-size:12px; line-height:1.6; margin:0; text-align:center;">
              Cet email est généré automatiquement suite à votre dépôt sur StatutPay.<br/>
              Besoin d'aide ? <a href="mailto:contact@statutpay.com" style="color:#4c075b; font-weight:600; text-decoration:none;">contact@statutpay.com</a>
            </p>
          </td>
        </tr>

        <!-- ============ FOOTER ============ -->
        <tr>
          <td style="background-color:#f8f9fa; padding:22px 40px; text-align:center; border-top:1px solid #e9ecef;">
            <p style="color:#888888; font-size:12px; margin:4px 0;">© 2026 <strong>StatutPay</strong>. Tous droits réservés.</p>
            <p style="color:#888888; font-size:12px; margin:4px 0;">Plateforme de micro-publicité pour annonceurs et diffuseurs</p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
  `;
}

// ─── Template d'email de confirmation de retrait ─────────────────────────
function getWithdrawalEmailHtml(montant: number, reference: string, solde: number, telephone: string): string {
  const date = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Confirmation de retrait - StatutPay</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f3; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f3; padding: 30px 0;">
  <tr>
    <td align="center">

      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <!-- ============ HEADER ============ -->
        <tr>
          <td style="background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); padding: 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <img src="cid:logo" alt="StatutPay" style="max-width:150px; height:auto; display:block;" />
                </td>
                <td valign="middle" align="right">
                  <p style="color:#ffffff; font-size:13px; letter-spacing:1px; text-transform:uppercase; margin:0 0 4px 0; opacity:0.85;">Retrait</p>
                  <p style="color:#ffffff; font-size:18px; font-weight:700; margin:0;">Effectué 💸</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ STATUT ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#d1ecf1; border-radius:20px; padding:6px 16px;">
                  <span style="color:#0c5460; font-size:13px; font-weight:700;">&#10003; EFFECTUÉ</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ INTRO ============ -->
        <tr>
          <td style="padding: 20px 40px 0 40px;">
            <p style="color:#333333; font-size:15px; line-height:1.6; margin:0;">
              Bonjour,
            </p>
            <p style="color:#555555; font-size:15px; line-height:1.7; margin:12px 0 0 0;">
              Votre demande de retrait a été traitée avec succès. Les fonds ont été transférés vers votre compte Mobile Money.
            </p>
          </td>
        </tr>

        <!-- ============ RÉCAPITULATIF ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-bottom:2px solid #4c075b; padding:0 0 10px 0;">
                  <span style="color:#4c075b; font-size:12px; font-weight:700; text-transform:uppercase;">Description</span>
                </td>
                <td style="border-bottom:2px solid #4c075b; padding:0 0 10px 0;" align="right">
                  <span style="color:#4c075b; font-size:12px; font-weight:700; text-transform:uppercase;">Montant</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0; border-bottom:1px solid #f0f0f0;">
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0 0 3px 0;">Retrait vers Mobile Money</p>
                  <p style="color:#999999; font-size:12px; margin:0;">${telephone}</p>
                </td>
                <td style="padding:16px 0; border-bottom:1px solid #f0f0f0;" align="right" valign="top">
                  <span style="color:#17a2b8; font-size:16px; font-weight:700;">- ${montant.toLocaleString('fr-FR')} F</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ DATE / REF ============ -->
        <tr>
          <td style="padding: 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #eeeeee;">
              <tr>
                <td style="padding:14px 0;">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Date</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">${date}</p>
                </td>
                <td style="padding:14px 0;">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Référence</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">${reference}</p>
                </td>
                <td style="padding:14px 0;" align="right">
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Destinataire</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">${telephone}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ NOUVEAU SOLDE ============ -->
        <tr>
          <td style="padding: 24px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8f4fa 0%, #f0e8f5 100%); border-radius:8px;">
              <tr>
                <td style="padding:18px 20px;">
                  <span style="color:#555555; font-size:13px;">Nouveau solde du portefeuille</span>
                </td>
                <td style="padding:18px 20px;" align="right">
                  <span style="color:#4c075b; font-size:18px; font-weight:700;">${solde.toLocaleString('fr-FR')} F</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ INFO TRANSFERT ============ -->
        <tr>
          <td style="padding: 20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#d1ecf1; border-radius:8px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="color:#0c5460; font-size:13px; line-height:1.5; margin:0;">
                    <strong>ℹ️ Information :</strong> Le transfert vers votre compte Mobile Money est en cours. Vous recevrez les fonds dans les prochaines minutes selon votre opérateur.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ CTA ============ -->
        <tr>
          <td align="center" style="padding: 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px; background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%);">
                  <a href="${process.env.FRONTEND_URL}/dashboard/annonceur/portefeuille"
                     style="display:inline-block; padding:14px 36px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                    Voir mon portefeuille
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ MENTIONS ============ -->
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <p style="color:#999999; font-size:12px; line-height:1.6; margin:0; text-align:center;">
              Cet email est généré automatiquement suite à votre retrait sur StatutPay.<br/>
              Besoin d'aide ? <a href="mailto:contact@statutpay.com" style="color:#4c075b; font-weight:600; text-decoration:none;">contact@statutpay.com</a>
            </p>
          </td>
        </tr>

        <!-- ============ FOOTER ============ -->
        <tr>
          <td style="background-color:#f8f9fa; padding:22px 40px; text-align:center; border-top:1px solid #e9ecef;">
            <p style="color:#888888; font-size:12px; margin:4px 0;">© 2026 <strong>StatutPay</strong>. Tous droits réservés.</p>
            <p style="color:#888888; font-size:12px; margin:4px 0;">Plateforme de micro-publicité pour annonceurs et diffuseurs</p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
  `;
}

export default router;
