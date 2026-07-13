import { createContext, useContext, useEffect, useState } from "react";
import { getMeApi } from "../../lib/api";

type User = { nom: string; prenoms: string; role: string; email: string; telephone: string; nomEntreprise?: string; pieceIdentitePath?: string | null; googleId?: string | null };

type UserContextType = { user: User | null; refreshUser: () => void };

const UserContext = createContext<UserContextType>({ user: null, refreshUser: () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = () => {
    getMeApi().then(setUser).catch(() => null);
  };

  useEffect(() => { refreshUser(); }, []);

  return <UserContext.Provider value={{ user, refreshUser }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
