const BASE = "http://localhost:3000/api";

export async function loginApi(email: string, password: string, role: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.token as string;
}

export async function registerApi(formData: FormData) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.token as string;
}

export async function googleAuthApi(token: string, role?: string) {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.token as string;
}
