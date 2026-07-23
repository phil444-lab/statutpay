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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      
      <!-- Header avec logo -->
      <div style="background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); padding: 40px 20px; text-align: center;">
        <img src="cid:logo" alt="StatutPay Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
        <h1 style="color: #ffffff; font-size: 28px; margin-top: 20px; font-weight: 600;">Campagne débitée 📊</h1>
      </div>

      <!-- Corps de l'email -->
      <div style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Bonjour,
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
          Le budget de votre campagne a été débité de votre portefeuille <strong>StatutPay</strong>. Votre campagne est maintenant active !
        </p>

        <!-- Carte de confirmation -->
        <div style="background: linear-gradient(135deg, #f8f4fa 0%, #f0e8f5 100%); border-left: 4px solid #ffc107; padding: 25px; margin: 30px 0; border-radius: 8px;">
          <h2 style="color: #4c075b; font-size: 18px; margin-top: 0; margin-bottom: 20px;">
            📢 Récapitulatif du décaissement
          </h2>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666666; font-size: 14px;">Campagne</span>
              <span style="color: #4c075b; font-size: 14px; font-weight: 600; text-align: right; max-width: 60%;">${campagneNom}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666666; font-size: 14px;">Montant débité</span>
              <span style="color: #ffc107; font-size: 16px; font-weight: bold; text-shadow: 0 0 1px rgba(0,0,0,0.1);">- ${montant.toLocaleString('fr-FR')} F</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666666; font-size: 14px;">Référence</span>
              <span style="color: #4c075b; font-size: 13px; font-weight: 600;">${reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666666; font-size: 14px;">Date</span>
              <span style="color: #555555; font-size: 14px;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666666; font-size: 14px; font-weight: 600;">Nouveau solde</span>
              <span style="color: #4c075b; font-size: 16px; font-weight: bold;">${solde.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 8px;">
          <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>📈 Suivi de campagne :</strong> Vous pouvez suivre les performances de votre campagne en temps réel depuis votre tableau de bord. Les diffuseurs peuvent maintenant voir et accepter votre campagne.
          </p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/annonceur/campagnes" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(76, 7, 91, 0.3);">
            Voir mes campagnes
          </a>
        </div>

        <p style="color: #666666; font-size: 14px; line-height: 1.7; margin-top: 30px;">
          Besoin d'aide ? Contactez notre équipe support à <a href="mailto:contact@statutpay.com" style="color: #4c075b; text-decoration: none; font-weight: 600;">contact@statutpay.com</a>
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 30px; margin-bottom: 10px;">
          L'équipe StatutPay
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 25px 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #888888; font-size: 12px; margin: 5px 0;">
          © 2025 <strong>StatutPay</strong>. Tous droits réservés.
        </p>
        <p style="color: #888888; font-size: 12px; margin: 5px 0;">
          Plateforme de publicité innovante pour annonceurs et diffuseurs
        </p>
      </div>
    </div>
  `;
}

export default router;
