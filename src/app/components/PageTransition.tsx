import { useEffect, useState } from "react";
import { useLocation } from "react-router";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-4 border-[#4c075b]/20 border-t-[#4c075b] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
