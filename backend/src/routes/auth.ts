import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import path from "path";
import prisma from "../lib/prisma";

import crypto from "crypto";

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
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
      email,
      password: hashed,
      nom,
      prenoms,
      telephone,
      nomEntreprise: nomEntreprise || null,
      pieceIdentitePath: req.file?.path ?? null,
      role,
    },
  });

  return res.status(201).json({ token: generateToken(user.id, user.role) });
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

  return res.json({ token: generateToken(user.id, user.role) });
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
    user = await prisma.user.create({
      data: {
        email: payload.email,
        nom: payload.family_name ?? "",
        prenoms: payload.given_name ?? "",
        googleId: payload.sub,
        role,
      },
    });
  }

  return res.json({ token: generateToken(user.id, user.role) });
});

export default router;
