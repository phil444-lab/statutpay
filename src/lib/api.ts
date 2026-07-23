const BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

const opts = (method: string, body?: object): RequestInit => ({
  method,
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

export async function loginApi(email: string, password: string, role: string) {
  const res = await fetch(`${BASE}/auth/login`, opts("POST", { email, password, role }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data as { role: string };
}

export async function registerApi(formData: FormData) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
}

export async function googleAuthApi(token: string, role?: string) {
  const res = await fetch(`${BASE}/auth/google`, opts("POST", { token, role }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data as { tempPassword?: string; mustChangePassword?: boolean; role: string };
}

export async function logoutApi() {
  await fetch(`${BASE}/auth/logout`, opts("POST"));
}

export async function forgotPasswordApi(email: string) {
  const res = await fetch(`${BASE}/auth/forgot-password`, opts("POST", { email }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data as { message: string };
}

export async function verifyResetTokenApi(token: string) {
  const res = await fetch(`${BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}`, opts("GET"));
  const data = await res.json();
  return data as { valid: boolean };
}

export async function resetPasswordApi(token: string, password: string) {
  const res = await fetch(`${BASE}/auth/reset-password`, opts("POST", { token, password }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
}

export async function getMeApi() {
  const res = await fetchWithAuth("/auth/me");
  const data = await res.json();
  return data as { nom: string; prenoms: string; role: string; email: string; telephone: string; nomEntreprise?: string; pieceIdentitePath?: string | null; googleId?: string | null };
}

export async function getProfileApi() {
  const res = await fetchWithAuth("/auth/me");
  const data = await res.json();
  return data as { nom: string; prenoms: string; email: string; telephone: string; nomEntreprise?: string; pieceIdentitePath?: string | null; googleId?: string | null };
}

export async function updateProfileApi(formData: FormData) {
  const res = await fetchWithAuth("/auth/me", {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  const res = await fetchWithAuth("/auth/me/password", opts("PUT", { currentPassword, newPassword }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
}

export async function deleteAccountApi() {
  const res = await fetchWithAuth("/auth/me", { method: "DELETE", credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${url}`, { ...options, credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Session expirée");
  }
  return res;
}

// ─── Référentiels ────────────────────────────────────────────────────────────

export interface Pays {
  id: number; code: string; label: string;
  localites: { id: number; label: string; paysId: number }[];
}
export interface Profession { id: number; label: string; }
export interface CategorieCiblage { id: number; label: string; }
export interface TypeMedia { id: number; code: string; label: string; }
export interface CategorieCampagne { id: number; code: string; label: string; }

export interface Referentiels {
  pays: Pays[];
  professions: Profession[];
  categoriesCiblage: CategorieCiblage[];
  typesMedia: TypeMedia[];
  categoriesCampagne: CategorieCampagne[];
}

export async function getReferentielsApi(): Promise<Referentiels> {
  const res = await fetchWithAuth("/referentiels");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// ─── Campagnes ───────────────────────────────────────────────────────────────

export interface Campagne {
  id: number;
  nom: string;
  budget: number;
  dateDebut: string;
  dateFin: string;
  statut: "en_attente" | "actif" | "cloture" | "rejete";
  categorie: CategorieCampagne | null;
  typeMedia: TypeMedia | null;
  pays: Pays | null;
  medias: { id: number; path: string; mimetype: string }[];
  createdAt: string;
}

export interface CampagneFilters {
  statut?: string;
  categorieId?: number;
  dateDebut?: string;
  dateFin?: string;
  search?: string;
}

export async function getCampagnesApi(filters?: CampagneFilters): Promise<Campagne[]> {
  const params = new URLSearchParams();
  if (filters?.statut) params.set("statut", filters.statut);
  if (filters?.categorieId) params.set("categorieId", String(filters.categorieId));
  if (filters?.dateDebut) params.set("dateDebut", filters.dateDebut);
  if (filters?.dateFin) params.set("dateFin", filters.dateFin);
  if (filters?.search) params.set("search", filters.search);
  const res = await fetchWithAuth(`/campagnes?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getCampagneApi(id: number): Promise<Campagne> {
  const res = await fetchWithAuth(`/campagnes/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function createCampagneApi(formData: FormData): Promise<Campagne> {
  const res = await fetch(`${BASE}/campagnes`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function updateCampagneApi(id: number, formData: FormData): Promise<Campagne> {
  const res = await fetch(`${BASE}/campagnes/${id}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function deleteCampagneApi(id: number): Promise<void> {
  const res = await fetchWithAuth(`/campagnes/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
}

// ─── Portefeuille ────────────────────────────────────────────────────────────

export interface PortefeuilleData {
  solde: number;
  depotsMois: number;
  depensesMois: number;
  campagnesActives: number;
  budgetEngage: number;
  engageActif: number;
  transactions: TransactionData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionData {
  id: number;
  type: string;
  montant: number;
  reference: string | null;
  statut: string;
  fedapayStatus: string | null;
  description: string | null;
  modePaiement: string | null;
  createdAt: string;
}

export async function getPortefeuilleApi(page: number = 1, limit: number = 5): Promise<PortefeuilleData> {
  const res = await fetchWithAuth(`/portefeuille?page=${page}&limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getSoldeApi(): Promise<number> {
  const res = await fetchWithAuth("/portefeuille");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.solde;
}

export interface InitierDepotResponse {
  transactionId: number;
  reference: string;
  token: string;
  url: string;
}

export async function initierDepotApi(montant: number, description?: string): Promise<InitierDepotResponse> {
  const res = await fetchWithAuth("/portefeuille/initier-depot", opts("POST", { montant, description }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function confirmerDepotApi(reference: string): Promise<{ message: string; solde: number }> {
  const res = await fetchWithAuth("/portefeuille/confirmer-depot", opts("POST", { reference }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function reconfirmerDepotApi(transactionId: number): Promise<{ message: string; solde: number }> {
  const res = await fetchWithAuth("/portefeuille/reconfirmer-depot", opts("POST", { transactionId }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export interface RetraitResponse {
  message: string;
  solde: number;
  transaction: {
    id: number;
    type: string;
    montant: number;
    statut: string;
    description: string | null;
    createdAt: string;
  };
}

export async function retraitApi(montant: number, description?: string, telephone?: string): Promise<RetraitResponse> {
  const res = await fetchWithAuth("/portefeuille/retrait", opts("POST", { montant, description, telephone }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardData {
  stats: {
    actif: number;
    en_attente: number;
    cloture: number;
    rejete: number;
  };
  budgetEngage: number;
  solde: number;
  depensesMois: number;
  depotsMois: number;
  campagnes: {
    id: number;
    nom: string;
    statut: string;
    budget: number;
    dateDebut: string;
    dateFin: string;
    categorie: string | null;
  }[];
  evolution: {
    date: string;
    depenses: number;
    depots: number;
    budget: number;
  }[];
}

export async function getDashboardApi(period?: string): Promise<DashboardData> {
  const params = period ? `?period=${period}` : "";
  const res = await fetchWithAuth(`/dashboard${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// ─── Rapports ──────────────────────────────────────────────────────────────

export interface RapportsData {
  kpis: {
    impressions: number;
    portee: number;
    frequence: number;
    cpm: number;
    budgetEngage: number;
    solde: number;
    depenses: number;
  };
  evolution: {
    date: string;
    depenses: number;
    count: number;
  }[];
}

export async function getRapportsApi(period?: string, statut?: string): Promise<RapportsData> {
  const params = new URLSearchParams();
  if (period) params.set("period", period);
  if (statut && statut !== "tous") params.set("statut", statut);
  const qs = params.toString();
  const res = await fetchWithAuth(`/rapports${qs ? `?${qs}` : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
