import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Menu,
  X,
  ArrowRight,
  Megaphone,
  BadgeCheck,
  Smartphone,
  ScanEye,
  Award,
  Users,
  MapPin,
  Plus,
  HandCoins,
} from "lucide-react";
import logo from "../assets/logo.png";
import diffuseur1 from "../assets/illustrations/diffuseur-1-inscription.svg";
import diffuseur2 from "../assets/illustrations/diffuseur-2-missions.svg";
import diffuseur3 from "../assets/illustrations/diffuseur-3-publication.svg";
import diffuseur4 from "../assets/illustrations/diffuseur-4-capture.svg";
import diffuseur5 from "../assets/illustrations/diffuseur-5-paiement.svg";
import annonceur1 from "../assets/illustrations/annonceur-1-campagne.svg";
import annonceur2 from "../assets/illustrations/annonceur-2-reseau.svg";
import annonceur3 from "../assets/illustrations/annonceur-3-verification-ia.svg";
import annonceur4 from "../assets/illustrations/annonceur-4-dashboard.svg";

// ─── Hook parallax générique ───────────────────────────────────────────────
function useParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respecter prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;

    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.parentElement!.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;
        ref.current.style.transform = `translateY(${centerY * speed}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  return ref;
}

// ─── Hook reveal au scroll ─────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Composant carte avec reveal ──────────────────────────────────────────
function RevealCard({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Composant étape avec reveal latéral ──────────────────────────────────
function RevealStep({ children, delay = 0, fromLeft = true }: {
  children: React.ReactNode;
  delay?: number;
  fromLeft?: boolean;
}) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : `translateX(${fromLeft ? "-24px" : "24px"})`,
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Composant illustration avec float doux ───────────────────────────────
function FloatingIllo({ src, alt, delay = 0 }: { src: string; alt: string; delay?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-24 h-24 sm:w-32 sm:h-32 md:w-38 md:h-38 flex-shrink-0 mx-auto sm:mx-0"
      style={{
        animation: `floatIllo 4s ease-in-out ${delay}ms infinite`,
      }}
    />
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeParcours, setActiveParcours] = useState("gagner");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Parallax pour les blobs hero
  const blobTopRef = useParallax(0.12);
  const blobBottomRef = useParallax(-0.1);

  // Parallax pour le titre hero
  const heroTitleRef = useParallax(0.06);

  // Reveal pour le titre "Pourquoi" et "Comment"
  const { ref: whyTitleRef, visible: whyTitleVisible } = useScrollReveal();
  const { ref: howTitleRef, visible: howTitleVisible } = useScrollReveal();
  const { ref: faqTitleRef, visible: faqTitleVisible } = useScrollReveal();
  const { ref: ctaTitleRef, visible: ctaTitleVisible } = useScrollReveal(0.2);

  const navLinks = [
    { label: "Accueil", href: "#accueil" },
    { label: "À propos", href: "#pourquoi" },
    { label: "Comment ça marche", href: "#comment" },
    { label: "FAQ", href: "#faq" },
  ];

  const footerCols = [
    {
      title: "Produit",
      links: [
        { label: "Accueil", href: "#accueil" },
        { label: "À propos", href: "#pourquoi" },
        { label: "Comment ça marche", href: "#comment" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "contact@statutpay.com", href: "mailto:contact@statutpay.com" },
        { label: "+229 01 XX XX XX XX", href: "tel:+22901XXXXXXXX" },
      ],
    },
  ];

  return (
    <>
      {/* ── Keyframes globaux ── */}
      <style>{`
        @keyframes floatIllo {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes heroBadgePop {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes heroStatSlide {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground font-[var(--font-inter)]">

        {/* ── NAV ── */}
        <header className="sticky top-0 z-50 bg-[#4c075b] border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-2 select-none">
              <img src={logo} alt="StatutPay Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold font-playfair italic text-lg tracking-tight text-white">
                Statut<span className="text-[#c9a227]">Pay</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-12">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-l font-medium text-white hover:text-[#c9a227] transition-colors duration-150"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium px-4 py-2 rounded-lg border border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-white hover:-translate-y-0.5 transition-all duration-150"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-5 py-2 rounded-lg text-[#4c075b] bg-white hover:bg-white hover:-translate-y-0.5 transition-all duration-150"
              >
                Créer un compte
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-[#c9a227]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden border-t border-border bg-white px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-[#4c075b] py-1">
                  {link.label}
                </a>
              ))}
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white text-center mt-2 bg-[#4c075b]"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </header>

        {/* ── HERO ── */}
        <section
          id="accueil"
          className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-br from-white via-[#f9f0fb] to-white"
        >
          {/* Blobs parallax */}
          <div ref={blobTopRef} className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-violet)] opacity-20 blur-3xl pointer-events-none will-change-transform" />
          <div ref={blobBottomRef} className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[var(--color-gold)] opacity-20 blur-3xl pointer-events-none will-change-transform" />

          <div className="max-w-5xl mx-auto px-6 text-center relative">
            {/* Titre avec parallax léger */}
            <div ref={heroTitleRef} className="will-change-transform">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight text-[var(--color-violet)] font-playfair italic px-2">
                Touchez des milliers de clients et gagnez de l'argent en partageant des pubs sur votre WhatsApp.
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-800 font-medium font-playfair mb-10 max-w-2xl mx-auto leading-relaxed px-2">
                StatutPay connecte les marques locales avec des personnes comme toi. Partage une publicité sur ton Statut pendant 24h, prouve-le avec une capture d'écran, et reçois ton argent sur{" "}
                <span className="text-yellow-500 font-bold">MTN MoMo</span>,{" "}
                <span className="text-orange-500 font-bold">Moov Money</span> ou{" "}
                <span className="text-blue-900 font-bold">Celtiis Cash</span>.
              </p>
            </div>

            <div className="mb-6">
              {/* Badge animé à l'entrée */}
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-12 sm:mb-16 border border-[#4c075b] bg-[#eed0f5] text-[var(--color-violet)]"
                style={{ animation: "heroBadgePop 0.6s ease 0.2s both" }}
              >
                <p className="italic text-center">Deux parcours : DIFFUSEUR et ANNONCEUR</p>
              </div>

              {/* Stats avec slide-up en cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { value: "+1000", label: "XOF par mission" },
                  { value: "+24h", label: "durée de diffusion" },
                  { value: "100%", label: "paiement Mobile Money" },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#c9a227] rounded-xl p-4 sm:p-6 md:p-8 text-center shadow-sm hover:-translate-y-0.5 transition-all duration-150"
                    style={{ animation: `heroStatSlide 0.55s ease ${200 + idx * 120}ms both` }}
                  >
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#c9a227] mb-2">{card.value}</p>
                    <p className="text-sm sm:text-base md:text-lg text-gray-800 italic">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── POURQUOI STATUTPAY ── */}
        <section id="pourquoi" className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">

            {/* Titre reveal */}
            <div
              ref={whyTitleRef}
              className="text-center mb-4 sm:mb-6"
              style={{
                opacity: whyTitleVisible ? 1 : 0,
                transform: whyTitleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--color-violet)] px-2">
                Pourquoi StatutPay ?
              </h2>
            </div>

            <div className="text-center mb-8 sm:mb-12">
              <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium font-playfair italic text-gray-900 px-2">
                Que devez-vous savoir avant de rejoindre notre plateforme de paiement WhatsApp ?
              </h4>
            </div>

            {/* Grille cartes avec reveal en cascade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  icon: <BadgeCheck size={32} />,
                  title: "Paiements garantis",
                  desc: "Chaque diffuseur reçoit son argent dès validation de la preuve. Aucun retard, aucune arnaque.",
                },
                {
                  icon: <Smartphone size={32} />,
                  title: "Mobile Money uniquement",
                  desc: "Pas besoin de carte bancaire. Reçois ton paiement directement sur MTN MoMo, Moov Money ou Celtiis Cash.",
                },
                {
                  icon: <ScanEye size={32} />,
                  title: "Vérification IA",
                  desc: "Notre intelligence artificielle analyse automatiquement chaque capture d'écran pour garantir la conformité.",
                },
                {
                  icon: <Award size={32} />,
                  title: "Système de niveaux",
                  desc: "Plus tu diffuses, plus tu gagnes. Débloque des badges et accède à des missions mieux rémunérées.",
                },
                {
                  icon: <Users size={32} />,
                  title: "Programme de parrainage",
                  desc: "Invite tes amis pour te faire plus de gains. Crée ton propre réseau de diffuseurs.",
                },
                {
                  icon: <MapPin size={32} />,
                  title: "Fait pour l'Afrique de l'Ouest",
                  desc: "Conçu spécifiquement pour les marchés béninois, togolais, ivoiriens et sénégalais.",
                },
              ].map((item, idx) => (
                <RevealCard
                  key={idx}
                  delay={idx * 80}
                  className="bg-white rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 border border-[var(--color-gold)]"
                >
                  <div className="text-[var(--color-gold)] mb-3 sm:mb-4">{item.icon}</div>
                  <h3 className="text-gray-900 font-bold text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg font-playfair leading-relaxed">
                    {item.desc}
                  </p>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ── */}
        <section id="comment" className="py-20 bg-[#f3e4f7] relative">
          <div className="max-w-7xl mx-auto px-6">

            <div
              ref={howTitleRef}
              className="text-center mb-4 sm:mb-6"
              style={{
                opacity: howTitleVisible ? 1 : 0,
                transform: howTitleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--color-violet)] px-2">
                Comment ça marche ?
              </h2>
            </div>

            <div className="text-center mb-8 sm:mb-12">
              <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium font-playfair italic text-gray-900 px-2">
                Un processus simple et rapide pour les diffuseurs et les annonceurs.
              </h4>
            </div>

            {/* Boutons de parcours */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <button
                onClick={() => setActiveParcours("gagner")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold border-2 transition-all duration-200 ${
                  activeParcours === "gagner"
                    ? "border-[var(--color-violet)] bg-[var(--color-violet)] text-white shadow-[0_4px_14px_#4c075b33]"
                    : "border-transparent bg-white text-gray-700 shadow-sm"
                }`}
              >
                <HandCoins size={20} /> Je veux gagner
              </button>
              <button
                onClick={() => setActiveParcours("pub")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold border-2 transition-all duration-200 ${
                  activeParcours === "pub"
                    ? "border-[var(--color-violet)] bg-[var(--color-violet)] text-white shadow-[0_4px_14px_#4c075b33]"
                    : "border-transparent bg-white text-gray-700 shadow-sm"
                }`}
              >
                <Megaphone size={20} /> Je veux faire de la pub
              </button>
            </div>

            {/* Parcours diffuseur */}
            {activeParcours === "gagner" && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[var(--color-violet)] flex flex-col gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  {[
                    { number: "1", title: "Crée ton compte diffuseur", desc: "Inscris-toi gratuitement en quelques secondes avec ton numéro WhatsApp.", image: diffuseur1 },
                    { number: "2", title: "Choisis ta mission", desc: "Parcours les campagnes disponibles et sélectionne celle qui t'intéresse.", image: diffuseur2 },
                    { number: "3", title: "Publie pendant 24h", desc: "Partage le contenu publicitaire sur ton Statut WhatsApp pendant 24 heures.", image: diffuseur3 },
                    { number: "4", title: "Envoie ta capture d'écran", desc: "Prouve ta publication avec une capture d'écran de ton Statut actif.", image: diffuseur4 },
                    { number: "5", title: "Reçois ton argent", desc: "Ton paiement arrive directement sur MTN MoMo, Moov Money ou Celtiis Cash.", image: diffuseur5 },
                  ].map((step, idx) => (
                    <RevealStep key={idx} delay={idx * 100} fromLeft={idx % 2 === 0}>
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        {/* Illustration avec float doux */}
                        <FloatingIllo src={step.image} alt={step.title} delay={idx * 600} />
                        <div className="flex-1 text-center sm:text-left">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-violet)] flex items-center justify-center my-2 sm:my-4 mx-auto sm:mx-0">
                            <span className="text-sm sm:text-md font-black text-white">{step.number}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">{step.title}</h3>
                          <p className="text-base sm:text-lg md:text-xl text-[var(--color-violet)] font-playfair italic">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </RevealStep>
                  ))}
                </div>
              </div>
            )}

            {/* Parcours annonceur */}
            {activeParcours === "pub" && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[var(--color-violet)] flex flex-col gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  {[
                    { number: "1", title: "Crée ta campagne", desc: "Définis ton budget, uploade ton visuel (image ou vidéo), et choisis ta cible géographique.", image: annonceur1 },
                    { number: "2", title: "Des vraies personnes diffusent ta pub", desc: "Des diffuseurs vérifiés publient ton visuel sur leurs Statut WhatsApp auprès de leur réseau réel.", image: annonceur2 },
                    { number: "3", title: "Preuves vérifiées automatiquement", desc: "Notre IA analyse chaque capture d'écran soumise. Tu ne paies que les diffusions confirmées.", image: annonceur3 },
                    { number: "4", title: "Suis tes résultats en temps réel", desc: "Dashboard en direct : nombre de diffuseurs actifs, vues estimées, budget consommé.", image: annonceur4 },
                  ].map((step, idx) => (
                    <RevealStep key={idx} delay={idx * 100} fromLeft={idx % 2 === 0}>
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <FloatingIllo src={step.image} alt={step.title} delay={idx * 600} />
                        <div className="flex-1 text-center sm:text-left">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-violet)] flex items-center justify-center my-2 sm:my-4 mx-auto sm:mx-0">
                            <span className="text-sm sm:text-lg font-black text-white">{step.number}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">{step.title}</h3>
                          <p className="text-base sm:text-lg text-[var(--color-violet)] font-playfair italic">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </RevealStep>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">

            <div
              ref={faqTitleRef}
              className="text-center mb-4 sm:mb-6"
              style={{
                opacity: faqTitleVisible ? 1 : 0,
                transform: faqTitleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--color-violet)] px-2">
                Questions fréquentes
              </h2>
            </div>

            <div className="text-center mb-8 sm:mb-12">
              <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium font-playfair italic text-gray-900 px-2">
                Tout ce que vous devez savoir sur{" "}
                <span className="text-[var(--color-violet)]">
                  Statut<span className="text-[#c9a227]">Pay</span>
                </span>.
              </h4>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Combien est-ce que je peux gagner ?",
                  answer: "Chaque mission paie entre 500 et 5 000 XOF selon la campagne, voir plus. Plus tu as de vues sur ton Statut, plus tu es prioritaire sur les missions bien rémunérées.",
                },
                {
                  question: "Comment je reçois mon argent ?",
                  answer: "Directement sur ton numéro MTN MoMo, Moov Money ou Celtiis Cash. Le transfert se fait automatiquement après validation de ta preuve.",
                },
                {
                  question: "Comment savoir si ma capture d'écran est acceptée ?",
                  answer: "Notre système d'Intelligence Artificielle analyse automatiquement ta capture en quelques secondes. Tu reçois une notification immédiate avec le résultat.",
                },
                {
                  question: "Je n'ai pas beaucoup de contacts WhatsApp, puis-je quand même participer ?",
                  answer: "Oui. Même avec 50 contacts actifs, tu peux déjà participer à des missions.",
                },
                {
                  question: 'C\'est quoi un "diffuseur" StatutPay ?',
                  answer: "Ce sont plus de vraies personnes (entrepreneurs, étudiants, commerçants) en Afrique de l'Ouest, notamment au Bénin et au Togo, prêtes à devenir ambassadrices de votre marque. Triés sur le volet et géolocalisés selon vos besoins, ils partagent vos campagnes sur leurs statuts WhatsApp et sont rémunérés instantanément via Mobile Money.",
                },
                {
                  question: "Quelles garanties ai-je que ma publicité a vraiment été vue ?",
                  answer: "Zéro gaspillage de budget. Pour chaque mission, le diffuseur envoie une capture d'écran de son statut avec l'horodatage et son compteur de vues. Notre algorithme de vérification examine automatiquement la preuve en 14 points pour valider l'authenticité de la diffusion. Vous êtes facturé uniquement pour les vues certifiées.",
                },
              ].map((faq, idx) => (
                <RevealCard key={idx} delay={idx * 60}>
                  <div
                    className={`bg-white rounded-xl p-4 sm:p-6 transition-colors cursor-pointer hover:-translate-y-0.5 duration-150 ${
                      activeFaq === idx
                        ? "border-2 border-[#4c075b]"
                        : "border border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-gray-900 font-playfair text-base sm:text-lg flex-1 text-left">
                        {faq.question}
                      </h3>
                      <button
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activeFaq === idx ? "bg-[#4c075b] text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {activeFaq === idx ? <X size={16} /> : <Plus size={20} />}
                      </button>
                    </div>
                    {activeFaq === idx && (
                      <p className="text-base sm:text-lg md:text-xl text-[var(--color-violet)] font-playfair italic leading-relaxed mt-4">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-20 bg-gradient-to-br from-[var(--color-violet)] via-[#6b1080] to-[var(--color-violet)]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div
              ref={ctaTitleRef}
              style={{
                opacity: ctaTitleVisible ? 1 : 0,
                transform: ctaTitleVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight px-2">
                Prêt à transformer votre{" "}
                <span className="text-[var(--color-gold)]">business WhatsApp</span> ?
              </h2>
              <p className="text-violet-200 font-playfair italic text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
                Rejoignez des centaines de diffuseurs qui encaissent, facturent et automatisent grâce à StatutPay. Aucune carte bancaire requise.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base text-[var(--color-violet)] shadow-xl bg-white hover:bg-white hover:-translate-y-0.5 transition-all duration-150 w-full sm:w-auto"
              >
                Créer mon compte gratuitement <ArrowRight size={16} />
              </Link>
            </div>
            <p className="text-violet-300 font-playfair text-xs sm:text-sm md:text-md mt-6 px-2">
              Disponible en Afrique de l'Ouest · Sans engagement · Support 24/7
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer id="contact" className="bg-[var(--color-dark-bg)] text-gray-400">
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <img src={logo} alt="StatutPay Logo" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="font-bold font-playfair italic text-lg text-white">
                    Statut<span className="text-[var(--color-gold)]">Pay</span>
                  </span>
                </div>
                <p className="text-sm font-playfair leading-relaxed mb-5">
                  La plateforme de paiement WhatsApp pensée pour les entreprises africaines et mondiales.
                </p>
              </div>

              {footerCols.map((col) => (
                <div key={col.title}>
                  <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                  <ul className="flex flex-col gap-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {col.title === "Support" && (
                    <div className="flex gap-3 mt-6">
                      {["f", "tw", "in", "yt"].map((s) => (
                        <a
                          key={s}
                          href="#"
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors duration-150"
                        >
                          {s}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white">
                © {new Date().getFullYear()} StatutPay. Tous droits réservés.
              </p>
              <div className="flex gap-6">
                {["Politique de confidentialité", "CGU", "Mentions légales"].map((l) => (
                  <a key={l} href="#" className="text-sm text-white hover:text-gray-400 transition-colors duration-150">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
