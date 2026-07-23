import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
};

function setAuthCookie(res: Response, userId: number, role: string) {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "24h" });
  res.cookie("token", token, COOKIE_OPTIONS);
}

// Inscription classique
router.post("/register", upload.single("pieceIdentite"), async (req: Request, res: Response) => {
  const { email, password, nom, prenoms, telephone, nomEntreprise, role } = req.body;

  if (!email || !password || !nom || !prenoms || !role)
    return res.status(400).json({ message: "Champs obligatoires manquants" });

  if (!EMAIL_REGEX.test(email))
    return res.status(400).json({ message: "Adresse email invalide" });

  if (!PASSWORD_REGEX.test(password))
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email déjà utilisé" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email, password: hashed, nom, prenoms, telephone,
      nomEntreprise: nomEntreprise || null,
      pieceIdentitePath: req.file?.path ?? null,
      role,
    },
  });

  setAuthCookie(res, user.id, user.role);

  // Envoyer l'email de bienvenue
  const welcomeHtml = getWelcomeEmailHtml(user.nom, user.prenoms, user.role);
  try {
    await transporter.sendMail({
      from: `"StatutPay" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Bienvenue sur StatutPay ! 🎉",
      html: welcomeHtml,
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../../../public/logo.png"),
          cid: "logo",
        },
      ],
    });
  } catch (err) {
    console.error("Erreur envoi email bienvenue:", err);
  }

  return res.status(201).json({ message: "Inscription réussie" });
});

// Connexion classique
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password || user.deletedAt)
    return res.status(401).json({ message: "Identifiants incorrects" });

  if (user.role !== role)
    return res.status(403).json({ message: "Profil incorrect pour ce compte" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });

  setAuthCookie(res, user.id, user.role);
  return res.json({ message: "Connexion réussie", role: user.role });
});

// Connexion / Inscription Google
router.post("/google", async (req: Request, res: Response) => {
  const { token, role } = req.body;

  if (!token) return res.status(400).json({ message: "Token Google manquant" });

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) return res.status(400).json({ message: "Token Google invalide" });

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  // Si le compte a été supprimé, refuser la connexion
  if (user?.deletedAt) {
    return res.status(401).json({ message: "Ce compte a été supprimé." });
  }

  if (!user) {
    if (!role) return res.status(400).json({ message: "Rôle requis pour l'inscription" });

    const tempPassword = Buffer.from(crypto.getRandomValues(new Uint8Array(10))).toString("base64url");
    const hashed = await bcrypt.hash(tempPassword, 10);

    user = await prisma.user.create({
      data: {
        email: payload.email,
        nom: payload.family_name ?? "",
        prenoms: payload.given_name ?? "",
        googleId: payload.sub,
        password: hashed,
        role,
      },
    });

    setAuthCookie(res, user.id, user.role);

    // Envoyer l'email de bienvenue pour inscription Google
    const welcomeHtml = getWelcomeEmailHtml(user.nom, user.prenoms, user.role);
    try {
      await transporter.sendMail({
        from: `"StatutPay" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Bienvenue sur StatutPay ! 🎉",
        html: welcomeHtml,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, "../../../public/logo.png"),
            cid: "logo",
          },
        ],
      });
    } catch (err) {
      console.error("Erreur envoi email bienvenue:", err);
    }

    return res.json({ tempPassword, mustChangePassword: true, role: user.role });
  }

  setAuthCookie(res, user.id, user.role);
  return res.json({ message: "Connexion réussie", role: user.role });
});

// Vérification de session
router.get("/me", async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Non authentifié" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { nom: true, prenoms: true, role: true, email: true, telephone: true, nomEntreprise: true, pieceIdentitePath: true, googleId: true, deletedAt: true },
    });
    if (!user || user.deletedAt) return res.status(401).json({ message: "Utilisateur introuvable" });
    setAuthCookie(res, decoded.userId, decoded.role);
    return res.json(user);
  } catch {
    return res.status(401).json({ message: "Session expirée" });
  }
});

// Mise à jour du profil (avec upload de pièce d'identité)
router.put("/me", upload.single("pieceIdentite"), async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Non authentifié" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string };
    const { nom, prenoms, email, telephone, nomEntreprise } = req.body;

    if (email && !EMAIL_REGEX.test(email))
      return res.status(400).json({ message: "Adresse email invalide" });

    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: decoded.userId } } });
      if (existing) return res.status(409).json({ message: "Email déjà utilisé" });
    }

    const data: any = {};
    if (nom) data.nom = nom;
    if (prenoms) data.prenoms = prenoms;
    if (email) data.email = email;
    if (telephone !== undefined) data.telephone = telephone;
    if (nomEntreprise !== undefined) data.nomEntreprise = nomEntreprise;
    if (req.file) data.pieceIdentitePath = req.file.path;

    const updated = await prisma.user.update({
      where: { id: decoded.userId },
      data,
      select: { nom: true, prenoms: true, email: true, telephone: true, nomEntreprise: true, pieceIdentitePath: true, role: true },
    });
    return res.json(updated);
  } catch {
    return res.status(401).json({ message: "Session expirée" });
  }
});

// Changement de mot de passe
router.put("/me/password", async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Non authentifié" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Si l'utilisateur n'a pas de googleId (inscription classique), vérifier l'ancien mot de passe
    if (!user.googleId) {
      if (!currentPassword) return res.status(400).json({ message: "Mot de passe actuel requis" });
      const valid = await bcrypt.compare(currentPassword, user.password!);
      if (!valid) return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }
    // Si l'utilisateur a un googleId (connexion Google), on permet d'en définir un sans vérification

    if (!PASSWORD_REGEX.test(newPassword))
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });
    return res.json({ message: "Mot de passe modifié avec succès" });
  } catch {
    return res.status(401).json({ message: "Session expirée" });
  }
});

// Suppression de compte (soft delete)
router.delete("/me", async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Non authentifié" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { deletedAt: new Date() },
    });
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.json({ message: "Compte supprimé avec succès." });
  } catch {
    return res.status(401).json({ message: "Session expirée" });
  }
});

// Déconnexion
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.json({ message: "Déconnecté" });
});

// ─── Mot de passe oublié ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !EMAIL_REGEX.test(email))
    return res.status(400).json({ message: "Adresse email invalide" });

  const user = await prisma.user.findUnique({ where: { email } });
  // Ne pas révéler si l'email existe ou pas (sécurité)
  if (!user) {
    return res.json({ message: "Si cet email existe, un lien de réinitialisation vous a été envoyé." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Essayer d'envoyer l'email, sinon afficher le lien dans la console
  try {
    await transporter.sendMail({
      from: `"StatutPay" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe StatutPay",
      html: getResetPasswordEmailHtml(resetLink),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../../../public/logo.png"),
          cid: "logo",
        },
      ],
    });
  } catch (err) {
    // En mode dev, afficher le lien dans la console au lieu de bloquer
    console.log("══════════════════════════════════════════════");
    console.log("🔗 LIEN DE RÉINITIALISATION (mode debug) :");
    console.log(`   ${resetLink}`);
    console.log("══════════════════════════════════════════════");
  }

  return res.json({ message: "Si cet email existe, un lien de réinitialisation vous a été envoyé." });
});

// ─── Vérification du token de réinitialisation ──────────────────────────
router.get("/verify-reset-token", async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  if (!token) return res.status(400).json({ valid: false });

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date())
    return res.status(400).json({ valid: false });

  return res.json({ valid: true });
});

// ─── Réinitialisation du mot de passe ────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token) return res.status(400).json({ message: "Token manquant." });

  if (!PASSWORD_REGEX.test(password))
    return res.status(400).json({
      message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    });

  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    return res.status(400).json({ message: "Token invalide ou expiré." });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return res.json({ message: "Mot de passe réinitialisé avec succès." });
});

// ─── Template d'email de bienvenue ─────────────────────────────────────
function getWelcomeEmailHtml(nom: string, prenoms: string, role: string): string {
  const roleLabel = role === "annonceur" ? "Annonceur" : "Diffuseur";
  const roleDescription = role === "annonceur"
    ? "créer et gérer vos campagnes publicitaires, cibler votre audience et suivre les performances de vos annonces en temps réel"
    : "diffuser des publicités sur votre établissement, générer des revenus supplémentaires et maximiser l'utilisation de vos espaces publicitaires";
  const dashboardUrl = role === "annonceur" 
    ? `${process.env.FRONTEND_URL}/dashboard/annonceur`
    : `${process.env.FRONTEND_URL}/dashboard/diffuseur`;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      
      <!-- Header avec logo -->
      <div style="background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); padding: 40px 20px; text-align: center;">
        <img src="cid:logo" alt="StatutPay Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
        <h1 style="color: #ffffff; font-size: 28px; margin-top: 20px; font-weight: 600;">Bienvenue sur StatutPay !</h1>
      </div>

      <!-- Corps de l'email -->
      <div style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Bonjour <strong>${prenoms} ${nom}</strong>,
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
          Nous sommes ravis de vous accueillir sur <strong>StatutPay</strong> ! Votre inscription en tant que <strong style="color: #4c075b;">${roleLabel}</strong> a été confirmée avec succès.
        </p>

        <div style="background: linear-gradient(135deg, #f8f4fa 0%, #f0e8f5 100%); border-left: 4px solid #4c075b; padding: 20px; margin: 30px 0; border-radius: 8px;">
          <h2 style="color: #4c075b; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
            ${role === "annonceur" ? "📢 En tant qu'Annonceur" : "📺 En tant que Diffuseur"}
          </h2>
          <p style="color: #555555; font-size: 14px; line-height: 1.7; margin: 0;">
            StatutPay vous permet de ${roleDescription}. Notre plateforme innovante connecte les annonceurs et les diffuseurs pour créer un écosystème publicitaire efficace et performant.
          </p>
        </div>

        <h3 style="color: #4c075b; font-size: 16px; margin-top: 30px; margin-bottom: 15px;">✨ Que pouvez-vous faire maintenant ?</h3>
        
        <ul style="color: #555555; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          ${role === "annonceur" 
            ? `
              <li>Créer votre première campagne publicitaire en quelques clics</li>
              <li>Définir votre budget et votre audience cible</li>
              <li>Suivre les performances de vos campagnes en temps réel</li>
              <li>Analyser les rapports détaillés pour optimiser vos investissements</li>
            `
            : `
              <li>Parcourir les campagnes disponibles dans votre région</li>
              <li>Accepter les diffusions correspondant à votre établissement</li>
              <li>Générer des revenus supplémentaires facilement</li>
              <li>Suivre vos gains et votre historique de diffusions</li>
            `
          }
        </ul>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(76, 7, 91, 0.3);">
            Accéder à mon tableau de bord
          </a>
        </div>

        <p style="color: #666666; font-size: 14px; line-height: 1.7; margin-top: 30px;">
          Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter notre équipe support. Nous sommes là pour vous accompagner dans votre expérience StatutPay.
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 30px; margin-bottom: 10px;">
          Bienvenue dans la communauté StatutPay !
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 25px 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #888888; font-size: 12px; margin: 5px 0;">
          © 2026 <strong>StatutPay</strong>. Tous droits réservés.
        </p>
        <p style="color: #888888; font-size: 12px; margin: 5px 0;">
          Plateforme de publicité innovante pour annonceurs et diffuseurs
        </p>
      </div>
    </div>
  `;
}

// ─── Template d'email de réinitialisation de mot de passe ───────────────
function getResetPasswordEmailHtml(resetLink: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      
      <!-- Header avec logo -->
      <div style="background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); padding: 40px 20px; text-align: center;">
        <img src="cid:logo" alt="StatutPay Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
        <h1 style="color: #ffffff; font-size: 28px; margin-top: 20px; font-weight: 600;">Réinitialisation de mot de passe</h1>
      </div>

      <!-- Corps de l'email -->
      <div style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Bonjour,
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
          Vous avez demandé la réinitialisation de votre mot de passe <strong>StatutPay</strong>. Aucun problème, nous sommes là pour vous aider !
        </p>

        <div style="background: linear-gradient(135deg, #f8f4fa 0%, #f0e8f5 100%); border-left: 4px solid #4c075b; padding: 20px; margin: 30px 0; border-radius: 8px;">
          <h2 style="color: #4c075b; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
            🔐 Créez un nouveau mot de passe
          </h2>
          <p style="color: #555555; font-size: 14px; line-height: 1.7; margin: 0;">
            Cliquez sur le bouton ci-dessous pour accéder à la page de réinitialisation. Vous pourrez alors choisir un nouveau mot de passe sécurisé.
          </p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4c075b 0%, #6b1d7a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(76, 7, 91, 0.3);">
            Réinitialiser mon mot de passe
          </a>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 8px;">
          <p style="color: #856404; font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>⏱️ Important :</strong> Ce lien expire dans <strong>1 heure</strong> pour des raisons de sécurité. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>

        <p style="color: #666666; font-size: 14px; line-height: 1.7; margin-top: 30px;">
          Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
        </p>
        <p style="color: #4c075b; font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 6px; margin-top: 10px;">
          ${resetLink}
        </p>

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
          © 2026 <strong>StatutPay</strong>. Tous droits réservés.
        </p>
        <p style="color: #888888; font-size: 12px; margin: 5px 0;">
          Plateforme de publicité innovante pour annonceurs et diffuseurs
        </p>
      </div>
    </div>
  `;
}

export default router;
