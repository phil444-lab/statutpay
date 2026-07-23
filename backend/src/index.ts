import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import referentielsRoutes from "./routes/referentiels";
import campagnesRoutes from "./routes/campagnes";
import portefeuilleRoutes from "./routes/portefeuille";
import dashboardRoutes from "./routes/dashboard";
import rapportsRoutes from "./routes/rapports";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/referentiels", referentielsRoutes);
app.use("/api/campagnes", campagnesRoutes);
app.use("/api/portefeuille", portefeuilleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rapports", rapportsRoutes);

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
