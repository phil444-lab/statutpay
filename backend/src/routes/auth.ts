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
  return res.status(201).json({ message: "Inscription réussie" });
});

// Connexion classique
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password)
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
    setAuthCookie(res, decoded.userId, decoded.role);
    return res.json(decoded);
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4c075b;">Réinitialisation de mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe StatutPay.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}"
               style="display: inline-block; padding: 12px 24px; background: #4c075b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Réinitialiser votre mot de passe
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">L'équipe StatutPay</p>
        </div>
      `,
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

export default router;
