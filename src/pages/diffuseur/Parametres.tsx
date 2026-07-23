import { useEffect, useState } from "react";
import { User, Lock, Save, Trash2, CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";
import { getProfileApi, updateProfileApi, changePasswordApi, deleteAccountApi } from "../../lib/api";
import PasswordInput from "../../app/components/PasswordInput";
import PhoneInput from "../../app/components/PhoneInput";
import { useUser } from "../../app/components/UserContext";

type Profile = { nom: string; prenoms: string; email: string; telephone: string; nomEntreprise: string; pieceIdentitePath?: string | null };
type Status = { type: "success" | "error"; message: string } | null;

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white";
const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block";

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-[#4c075b]/10 flex items-center justify-center text-[#4c075b]">
          {icon}
        </div>
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  const isSuccess = status.type === "success";
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {status.message}
    </div>
  );
}

export default function Parametres() {
  const [profile, setProfile] = useState<Profile>({ nom: "", prenoms: "", email: "", telephone: "", nomEntreprise: "", pieceIdentitePath: null });
  const [pieceFile, setPieceFile] = useState<File | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>(null);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<Status>(null);

  const { user, refreshUser } = useUser();
  const isGoogleUser = !!user?.googleId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<Status>(null);

  useEffect(() => {
    getProfileApi()
      .then((data) => setProfile({ ...data, nomEntreprise: data.nomEntreprise ?? "", pieceIdentitePath: data.pieceIdentitePath ?? null }))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  // Auto-disparition des messages de statut après 3 secondes
  useEffect(() => {
    if (!profileStatus) return;
    const timer = setTimeout(() => setProfileStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [profileStatus]);

  useEffect(() => {
    if (!pwdStatus) return;
    const timer = setTimeout(() => setPwdStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [pwdStatus]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const fd = new FormData();
      fd.append("nom", profile.nom);
      fd.append("prenoms", profile.prenoms);
      fd.append("email", profile.email);
      if (profile.telephone) fd.append("telephone", profile.telephone);
      if (profile.nomEntreprise) fd.append("nomEntreprise", profile.nomEntreprise);
      if (pieceFile) fd.append("pieceIdentite", pieceFile);
      const updated = await updateProfileApi(fd);
      setProfile((prev) => ({ ...prev, pieceIdentitePath: updated.pieceIdentitePath ?? prev.pieceIdentitePath }));
      refreshUser();
      setPieceFile(null);
      setProfileStatus({ type: "success", message: "Profil mis à jour avec succès." });
    } catch (err: any) {
      setProfileStatus({ type: "error", message: err.message ?? "Une erreur est survenue." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteStatus(null);
    try {
      await deleteAccountApi();
      window.location.href = "/login";
    } catch (err: any) {
      setDeleteStatus({ type: "error", message: err.message ?? "Une erreur est survenue." });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPwdStatus({ type: "error", message: "Les mots de passe ne correspondent pas." });
      return;
    }
    setSavingPwd(true);
    setPwdStatus(null);
    try {
      await changePasswordApi(passwords.current, passwords.next);
      setPwdStatus({ type: "success", message: "Mot de passe modifié avec succès." });
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwdStatus({ type: "error", message: err.message ?? "Une erreur est survenue." });
    } finally {
      setSavingPwd(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-[#4c075b]/20 border-t-[#4c075b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 font-playfair italic">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Informations du profil */}
      <SectionCard icon={<User size={16} />} title="Informations du profil">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nom de l'entreprise <span className="normal-case font-normal text-gray-400">(facultatif)</span></label>
            <input type="text" value={profile.nomEntreprise} placeholder="Ex: MonEntreprise SARL"
              onChange={(e) => setProfile({ ...profile, nomEntreprise: e.target.value })}
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nom</label>
              <input type="text" required value={profile.nom}
                onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénoms</label>
              <input type="text" required value={profile.prenoms}
                onChange={(e) => setProfile({ ...profile, prenoms: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Adresse email</label>
            <input type="email" required value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Téléphone</label>
            <PhoneInput value={profile.telephone} onChange={(v) => setProfile({ ...profile, telephone: v })} />
          </div>

          <div>
            <label className={labelClass}>Pièce d'identité</label>
            <div className="flex items-center gap-3">
              {profile.pieceIdentitePath && (
                <a
                  href={`http://localhost:3000/${profile.pieceIdentitePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#4c075b] font-medium hover:bg-[#f9f0fb] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Voir la pièce
                </a>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setPieceFile(e.target.files?.[0] ?? null)}
                className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f9f0fb] file:text-[#4c075b] hover:file:bg-[#f0e3f5] transition-colors cursor-pointer"
              />
              {pieceFile && (
                <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                  Nouveau fichier
                </span>
              )}
            </div>
          </div>

          <StatusBanner status={profileStatus} />

          <button type="submit" disabled={savingProfile}
            className="self-end flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60">
            <Save size={15} />
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </SectionCard>

      {/* Sécurité */}
      <SectionCard icon={<Lock size={16} />} title="Sécurité">
        <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
          {!isGoogleUser && (
            <div>
              <label className={labelClass}>Mot de passe actuel</label>
              <PasswordInput required value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
            </div>
          )}

          <div>
            <label className={labelClass}>Nouveau mot de passe</label>
            <PasswordInput required showStrength value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Confirmer le nouveau mot de passe</label>
            <PasswordInput required value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwords.confirm.length > 0 && (
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwords.next === passwords.confirm ? "text-green-500" : "text-red-400"}`}>
                {passwords.next === passwords.confirm ? "✓ Les mots de passe correspondent" : "○ Les mots de passe ne correspondent pas"}
              </p>
            )}
          </div>

          <StatusBanner status={pwdStatus} />

          <button type="submit" disabled={savingPwd}
            className="self-end flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60">
            <Save size={15} />
            {savingPwd ? "Enregistrement..." : "Modifier le mot de passe"}
          </button>
        </form>
      </SectionCard>

      {/* Suppression du compte */}
      <SectionCard icon={<Trash2 size={16} />} title="Suppression du compte">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            La suppression de votre compte est irréversible. Toutes vos données seront définitivement perdues.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-150"
          >
            <Trash2 size={15} />
            Supprimer mon compte
          </button>
        </div>
      </SectionCard>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setDeleteStatus(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Supprimer le compte</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données personnelles, campagnes et informations seront définitivement effacées.
            </p>

            {deleteStatus && <StatusBanner status={deleteStatus} />}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteStatus(null); }}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirmer la suppression
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}