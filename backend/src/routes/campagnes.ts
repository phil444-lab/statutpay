import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import prisma from "../lib/prisma";
import nodemailer from "nodemailer";

// Fonction pour vérifier le solde et effectuer le décaissement
async function verifierEtDebiterPortefeuille(userId: number, montant: number, campagneId: number, description: string) {
  // Récupérer le portefeuille
  const portefeuille = await prisma.portefeuille.findUnique({
    where: { userId },
  });

  if (!portefeuille) {
    throw new Error("Portefeuille introuvable");
  }

  // Vérifier le solde
  if (portefeuille.solde < montant) {
    throw new Error(`Solde insuffisant. Solde actuel: ${portefeuille.solde} F, Montant requis: ${montant} F`);
  }

  // Effectuer le décaissement dans une transaction
  await prisma.$transaction([
    // Créer la transaction de dépense
    prisma.transaction.create({
      data: {
        portefeuilleId: portefeuille.id,
        type: "depense",
        montant,
        statut: "reussi",
        description,
        campagneId,
      },
    }),
    // Déduire le montant du solde
    prisma.portefeuille.update({
      where: { id: portefeuille.id },
      data: { solde: { decrement: montant } },
    }),
  ]);

  return portefeuille.solde - montant;
}

const router = Router();

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

  try {
    // Créer la campagne
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

    // Vérifier le solde et effectuer le décaissement automatique
    const budgetNum = Number(budget);
    try {
      const nouveauSolde = await verifierEtDebiterPortefeuille(
        req.user!.userId,
        budgetNum,
        campagne.id,
        `Décaissement pour campagne: ${nom}`
      );

      console.log(`✓ Décaissement effectué pour la campagne ${campagne.id}. Nouveau solde: ${nouveauSolde} F`);

      // Envoyer l'email de confirmation de décaissement
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (user) {
        const transaction = await prisma.transaction.findFirst({
          where: { portefeuilleId: campagne.annonceurId, type: "depense", campagneId: campagne.id },
          orderBy: { createdAt: "desc" },
        });
        const reference = transaction?.reference || `DEP-${Date.now()}`;
        const campaignDebitHtml = getCampaignDebitEmailHtml(budgetNum, nom, reference, nouveauSolde);
        await sendEmail(user.email, "Campagne débitée ! 📊", campaignDebitHtml);
      }

      return res.status(201).json({
        ...campagne,
        message: "Campagne créée avec succès",
        soldeApresDepecaissement: nouveauSolde,
      });
    } catch (error: any) {
      // Si le décaissement échoue, supprimer la campagne créée
      await prisma.campagne.delete({ where: { id: campagne.id } });
      
      console.error("Erreur décaissement:", error.message);
      return res.status(400).json({
        message: error.message || "Solde insuffisant pour créer cette campagne",
        requiresRecharge: true,
        soldeActuel: error.message.includes("Solde insuffisant") ? 
          (await prisma.portefeuille.findUnique({ where: { userId: req.user!.userId } }))?.solde : null,
        montantRequis: budgetNum,
      });
    }
  } catch (error: any) {
    console.error("Erreur création campagne:", error);
    return res.status(500).json({ message: "Erreur lors de la création de la campagne" });
  }
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
  await autoUpdateStatuts(req.user!.userId);

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

// ─── Template d'email de confirmation de décaissement ────────────────────
function getCampaignDebitEmailHtml(montant: number, campagneNom: string, reference: string, solde: number): string {
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
<title>Confirmation de décaissement - StatutPay</title>
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
                  <p style="color:#ffffff; font-size:13px; letter-spacing:1px; text-transform:uppercase; margin:0 0 4px 0; opacity:0.85;">Décaissement</p>
                  <p style="color:#ffffff; font-size:18px; font-weight:700; margin:0;">Campagne activée 📊</p>
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
                <td style="background-color:#fff3cd; border-radius:20px; padding:6px 16px;">
                  <span style="color:#856404; font-size:13px; font-weight:700;">&#10003; ACTIVÉE</span>
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
              Le budget de votre campagne <strong>${campagneNom}</strong> a été débité de votre portefeuille <strong>StatutPay</strong>. Votre campagne est maintenant active et visible par les diffuseurs !
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
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0 0 3px 0;">${campagneNom}</p>
                  <p style="color:#999999; font-size:12px; margin:0;">Décaissement pour campagne publicitaire</p>
                </td>
                <td style="padding:16px 0; border-bottom:1px solid #f0f0f0;" align="right" valign="top">
                  <span style="color:#ffc107; font-size:16px; font-weight:700;">- ${montant.toLocaleString('fr-FR')} F</span>
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
                  <p style="color:#999999; font-size:11px; text-transform:uppercase; margin:0 0 4px 0;">Type</p>
                  <p style="color:#333333; font-size:14px; font-weight:600; margin:0;">Campagne</p>
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

        <!-- ============ INFO SUIVI ============ -->
        <tr>
          <td style="padding: 20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd; border-radius:8px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="color:#856404; font-size:13px; line-height:1.5; margin:0;">
                    <strong>📈 Suivi de campagne :</strong> Vous pouvez suivre les performances de votre campagne en temps réel depuis votre tableau de bord. Les diffuseurs peuvent maintenant voir et accepter votre campagne.
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
                  <a href="${process.env.FRONTEND_URL}/dashboard/annonceur/campagnes"
                     style="display:inline-block; padding:14px 36px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                    Voir mes campagnes
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
              Cet email est généré automatiquement suite à l'activation de votre campagne sur StatutPay.<br/>
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
