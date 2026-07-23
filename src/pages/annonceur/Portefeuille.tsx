import { useEffect, useState } from "react";
import { Megaphone, Flame, ArrowDownCircle, ArrowUpCircle, History, RefreshCw, PlusCircle, Wallet, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getPortefeuilleApi, initierDepotApi, reconfirmerDepotApi, retraitApi, PortefeuilleData } from "../../lib/api";
import PhoneInput from "../../app/components/PhoneInput";

const statutBadge: Record<string, { label: string; class: string }> = {
  en_attente: { label: "En attente", class: "bg-amber-100 text-amber-700" },
  reussi: { label: "Réussi", class: "bg-green-100 text-green-700" },
  echoue: { label: "Échoué", class: "bg-red-100 text-red-700" },
};

const typeLabel: Record<string, string> = {
  depot: "Dépôt",
  depense: "Dépense",
  remboursement: "Remboursement",
  retrait: "Retrait",
};

export default function Portefeuille() {
  const [data, setData] = useState<PortefeuilleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal dépôt
  const [showModal, setShowModal] = useState(false);
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [depotLoading, setDepotLoading] = useState(false);
  const [depotMessage, setDepotMessage] = useState("");

  // Modal retrait
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [montantRetrait, setMontantRetrait] = useState("");
  const [descriptionRetrait, setDescriptionRetrait] = useState("");
  const [telephoneRetrait, setTelephoneRetrait] = useState("");
  const [retraitLoading, setRetraitLoading] = useState(false);
  const [retraitMessage, setRetraitMessage] = useState("");

  const chargerPortefeuille = async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");
      const limit = 5; // 5 transactions par page
      const result = await getPortefeuilleApi(page, limit);
      setData(result);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerPortefeuille(1);
  }, []);

  // Vérifier si on revient d'un paiement FedaPay (callback_url ou redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const id = params.get("id");

    if (status === "approved" && id) {
      // Nettoyer l'URL
      window.history.replaceState({}, "", "/dashboard/annonceur/portefeuille");
      chargerPortefeuille();
    }
  }, []);

  const handleInitierDepot = async () => {
    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum < 500) {
      setDepotMessage("Le montant minimum est de 500 F");
      return;
    }

    try {
      setDepotLoading(true);
      setDepotMessage("");
      const result = await initierDepotApi(montantNum, description || undefined);
      
      // Ouvrir FedaPay dans un nouvel onglet
      window.open(result.url, "_blank");
      
      // Fermer le modal et recharger
      setShowModal(false);
      setMontant("");
      setDescription("");
      await chargerPortefeuille();
    } catch (err: any) {
      setDepotMessage(err.message);
    } finally {
      setDepotLoading(false);
    }
  };

  const handleConfirmerDepot = async (transactionId: number) => {
    try {
      setDepotLoading(true);
      const result = await reconfirmerDepotApi(transactionId);
      setDepotMessage(result.message);
      await chargerPortefeuille();
    } catch (err: any) {
      setDepotMessage(err.message);
    } finally {
      setDepotLoading(false);
    }
  };

  const fermerModal = () => {
    setShowModal(false);
    setMontant("");
    setDescription("");
    setDepotMessage("");
  };

  const handleRetrait = async () => {
    const montantNum = parseFloat(montantRetrait);
    if (!montantNum || montantNum <= 0) {
      setRetraitMessage("Montant invalide");
      return;
    }

    if (data && montantNum > data.solde) {
      setRetraitMessage("Solde insuffisant");
      return;
    }

    try {
      setRetraitLoading(true);
      setRetraitMessage("");
      const result = await retraitApi(montantNum, descriptionRetrait || undefined, telephoneRetrait || undefined);
      
      setRetraitMessage(result.message);
      setShowRetraitModal(false);
      setMontantRetrait("");
      setDescriptionRetrait("");
      setTelephoneRetrait("");
      await chargerPortefeuille();
    } catch (err: any) {
      setRetraitMessage(err.message);
    } finally {
      setRetraitLoading(false);
    }
  };

  const handleRetraitEtMettreAJourProfil = () => {
    setShowRetraitModal(false);
    window.location.href = "/dashboard/annonceur/parametres";
  };

  const fermerModalRetrait = () => {
    setShowRetraitModal(false);
    setMontantRetrait("");
    setDescriptionRetrait("");
    setTelephoneRetrait("");
    setRetraitMessage("");
  };

  const formaterMontant = (montant: number) => {
    return montant.toLocaleString("fr-FR") + " F";
  };

  const formaterDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const KPIS = [
    { label: "Campagnes actives", value: data ? String(data.campagnesActives) : "0", icon: Megaphone, color: "bg-purple-100 text-purple-600" },
    { label: "Budget engagé", value: data ? formaterMontant(data.budgetEngage) : "0 F", icon: Flame, color: "bg-orange-100 text-orange-600" },
    { label: "Dépôts ce mois", value: data ? formaterMontant(data.depotsMois) : "0 F", icon: ArrowDownCircle, color: "bg-green-100 text-green-600" },
    { label: "Dépenses ce mois", value: data ? formaterMontant(data.depensesMois) : "0 F", icon: ArrowUpCircle, color: "bg-rose-100 text-rose-600" },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Bloc principal + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Carte solde */}
        <div className="lg:col-span-1 rounded-xl bg-gradient-to-br from-[#413204] to-[#c9a227] p-6 flex flex-col justify-between gap-6 text-white shadow-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={18} className="opacity-70" />
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Solde disponible</p>
            </div>
            <p className="text-4xl font-black tracking-tight">
              {data ? formaterMontant(data.solde) : "0 F"}
            </p>
            <div className="flex flex-col gap-1 mt-3 text-sm opacity-80">
              <span>Engagé (actif) : <span className="font-semibold">{data ? formaterMontant(data.engageActif) : "0 F"}</span></span>
              <span>Total dépensé : <span className="font-semibold">{data ? formaterMontant(data.depensesMois) : "0 F"}</span></span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
            >
              <PlusCircle size={15} />
              Dépôt
            </button>
            <button 
              onClick={() => setShowRetraitModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/20"
            >
              <ArrowUpCircle size={15} />
              Retrait
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {KPIS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Transactions récentes</p>
          <button
            onClick={() => chargerPortefeuille(currentPage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {data && data.transactions.length > 0 ? (
          <>
            <div className="divide-y divide-gray-50">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.type === "depot" ? "bg-green-100 text-green-600" :
                      tx.type === "depense" ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {tx.type === "depot" ? <ArrowDownCircle size={16} /> :
                       tx.type === "depense" ? <ArrowUpCircle size={16} /> :
                       tx.type === "retrait" ? <ArrowUpCircle size={16} /> :
                       <History size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {tx.description || typeLabel[tx.type] || tx.type}
                      </p>
                      <p className="text-xs text-gray-400">{formaterDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className={`text-sm font-semibold ${
                       tx.type === "depot" ? "text-green-600" : "text-red-600"
                     }`}>
                       {tx.type === "depot" ? "+" : "-"}{formaterMontant(tx.montant)}
                     </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      statutBadge[tx.statut]?.class || "bg-gray-100 text-gray-600"
                    }`}>
                      {statutBadge[tx.statut]?.label || tx.statut}
                    </span>
                    {tx.statut === "en_attente" && (
                      <button
                        onClick={async () => {
                          try {
                            setDepotLoading(true);
                            setDepotMessage("Confirmation en cours...");
                            await handleConfirmerDepot(tx.id);
                          } catch (err: any) {
                            setDepotMessage(err.message);
                          } finally {
                            setDepotLoading(false);
                          }
                        }}
                        disabled={depotLoading}
                        className="px-3 py-1.5 rounded-lg bg-[#c9a227] text-white text-xs font-semibold hover:bg-[#413204] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {depotLoading ? "Confirmation..." : "Confirmer"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.totalPages} • {data.pagination.total} transaction(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => chargerPortefeuille(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => chargerPortefeuille(currentPage + 1)}
                    disabled={currentPage === data.pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <History size={32} className="text-gray-200" />
            <p className="text-sm text-gray-400">Aucune transaction pour le moment.</p>
          </div>
        )}
      </div>

      {/* Modal de retrait */}
      {showRetraitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <button
              onClick={fermerModalRetrait}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <ArrowUpCircle size={20} className="text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Effectuer un retrait</h2>
                <p className="text-xs text-gray-400">Retrait vers votre compte Mobile Money</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (F CFA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={montantRetrait}
                  onChange={(e) => setMontantRetrait(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
                {data && (
                  <p className="text-xs text-gray-500 mt-1">
                    Solde disponible : {formaterMontant(data.solde)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnelle)</label>
                <input
                  type="text"
                  value={descriptionRetrait}
                  onChange={(e) => setDescriptionRetrait(e.target.value)}
                  placeholder="Ex: Retrait vers compte personnel"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone Mobile Money</label>
                <PhoneInput
                  value={telephoneRetrait}
                  onChange={setTelephoneRetrait}
                  required
                />
                {data && (
                  <p className="text-xs text-gray-500 mt-1">
                    Solde disponible : {formaterMontant(data.solde)}
                  </p>
                )}
              </div>

              {retraitMessage && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                  retraitMessage.includes("succès") 
                    ? "text-green-600 bg-green-50" 
                    : "text-red-600 bg-red-50"
                }`}>
                  {retraitMessage.includes("succès") ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {retraitMessage}
                </div>
              )}

              {retraitMessage.includes("téléphone") && (
                <button
                  onClick={handleRetraitEtMettreAJourProfil}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4c075b] text-white text-sm font-semibold hover:bg-[#413204] transition-colors"
                >
                  Mettre à jour mon profil
                </button>
              )}

              <button
                onClick={handleRetrait}
                disabled={retraitLoading || !montantRetrait || parseFloat(montantRetrait) <= 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retraitLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowUpCircle size={16} />
                )}
                {retraitLoading ? "Traitement..." : "Effectuer le retrait"}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Le retrait sera effectué immédiatement vers votre compte Mobile Money
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dépôt */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <button
              onClick={fermerModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center">
                <Wallet size={20} className="text-[#c9a227]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ajouter des fonds</h2>
                <p className="text-xs text-gray-400">Paiement sécurisé via FedaPay</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (F CFA)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex: Minimum 500 XOF"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnelle)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Rechargement compte pub"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                />
              </div>

              {depotMessage && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  {depotMessage}
                </div>
              )}

              <button
                onClick={handleInitierDepot}
                disabled={depotLoading || !montant || parseFloat(montant) < 500}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#413204] to-[#c9a227] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {depotLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <PlusCircle size={16} />
                )}
                {depotLoading ? "Initialisation..." : "Procéder au paiement"}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Paiement sécurisé via Mobile Money (MTN, Moov, etc.)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}