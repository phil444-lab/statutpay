const BASE = "http://localhost:3000/api";

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
