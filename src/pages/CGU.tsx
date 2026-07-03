import { Link } from "react-router";
import logo from "../assets/logo.png";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-[#4c075b] font-playfair italic mb-3 border-b border-[#4c075b]/10 pb-2">
      {title}
    </h2>
    <div className="text-gray-700 text-sm leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function CGU() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #4c075b 0%, #7b1a8a 35%, #c9a227 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b border-white/20" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="StatutPay" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold font-playfair italic text-lg text-white">
              Statut<span className="text-[#c9a227]">Pay</span>
            </span>
          </Link>
          <Link to="/register" className="text-md text-[#c9a227] font-semibold hover:underline opacity-90 hover:opacity-100">
            Créer un compte
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[#4c075b] font-playfair italic mb-2">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-sm text-gray-400">Dernière mise à jour : 03 juillet 2026</p>
          </div>

          <Section title="1. Identification de l'éditeur">
            <p>
              La plateforme <strong>StatutPay</strong> est éditée et exploitée par la société StatutPay,
              dont le siège social est situé à Cotonou, République du Bénin.
            </p>
            <p>Contact : <a href="mailto:contact@statutpay.com" className="text-[#4c075b] hover:underline">contact@statutpay.com</a></p>
          </Section>

          <Section title="2. Objet du service">
            <p>StatutPay est une plateforme numérique de mise en relation entre :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Les Diffuseurs</strong> : personnes physiques qui acceptent de diffuser des contenus publicitaires via leurs canaux (réseaux sociaux, statuts WhatsApp, etc.) en échange d'une rémunération.</li>
              <li><strong>Les Annonceurs</strong> : entreprises ou particuliers qui souhaitent promouvoir leurs produits ou services en s'appuyant sur le réseau de Diffuseurs.</li>
            </ul>
            <p>StatutPay agit en tant qu'intermédiaire technique et ne saurait être tenu responsable du contenu des campagnes publicitaires.</p>
          </Section>

          <Section title="3. Inscription et compte utilisateur">
            <p>L'accès aux services de StatutPay nécessite la création d'un compte. L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations exactes, complètes et à jour lors de l'inscription.</li>
              <li>Être âgé d'au moins 18 ans ou avoir l'autorisation d'un représentant légal.</li>
              <li>Soumettre une pièce d'identité valide (carte nationale d'identité, passeport ou tout document officiel reconnu).</li>
              <li>Garder confidentiels ses identifiants de connexion et ne pas les partager avec des tiers.</li>
            </ul>
            <p>Toute utilisation frauduleuse du compte entraîne la suspension immédiate et définitive du compte concerné.</p>
          </Section>

          <Section title="4. Obligations des Diffuseurs">
            <p>En s'inscrivant en tant que Diffuseur, l'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Diffuser les contenus publicitaires conformément aux instructions fournies par StatutPay.</li>
              <li>Ne pas modifier, altérer ou détourner les visuels et messages publicitaires.</li>
              <li>Respecter les délais et durées de diffusion convenus.</li>
              <li>Ne pas diffuser de contenus sur des canaux à caractère illicite, offensant ou contraire aux bonnes mœurs.</li>
              <li>Signaler toute anomalie ou difficulté technique à StatutPay dans les meilleurs délais.</li>
            </ul>
          </Section>

          <Section title="5. Obligations des Annonceurs">
            <p>En s'inscrivant en tant qu'Annonceur, l'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des contenus publicitaires légaux, conformes à la réglementation en vigueur au Bénin et dans les pays ciblés.</li>
              <li>Ne pas promouvoir de produits ou services illicites, dangereux, trompeurs ou contraires à l'ordre public.</li>
              <li>Régler les campagnes dans les délais convenus selon les modalités tarifaires en vigueur sur la plateforme.</li>
              <li>Respecter les droits de propriété intellectuelle des tiers dans les contenus soumis.</li>
            </ul>
          </Section>

          <Section title="6. Conditions financières">
            <p><strong>Pour les Annonceurs :</strong></p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>Le paiement des campagnes s'effectue selon les tarifs affichés sur la plateforme au moment de la commande.</li>
              <li>Tout paiement effectué est définitif sauf en cas de manquement avéré de StatutPay à ses obligations.</li>
            </ul>
            <p><strong>Pour les Diffuseurs :</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La rémunération est calculée selon les règles définies par StatutPay pour chaque campagne.</li>
              <li>Le versement est effectué après validation de la diffusion, dans un délai de 7 jours ouvrables.</li>
              <li>Un seuil minimum de retrait peut s'appliquer, tel qu'indiqué dans l'espace personnel du Diffuseur.</li>
              <li>StatutPay se réserve le droit de suspendre un versement en cas de suspicion de fraude ou de non-respect des présentes CGU.</li>
            </ul>
          </Section>

          <Section title="7. Propriété intellectuelle">
            <p>
              Les contenus publicitaires (visuels, textes, logos) soumis par les Annonceurs restent leur propriété exclusive.
              En les soumettant sur la plateforme, l'Annonceur accorde à StatutPay une licence non exclusive d'utilisation
              aux fins de diffusion via le réseau de Diffuseurs.
            </p>
            <p>
              La marque <strong>StatutPay</strong>, son logo, son interface et ses contenus propres sont protégés par le droit
              de la propriété intellectuelle. Toute reproduction sans autorisation écrite préalable est interdite.
            </p>
          </Section>

          <Section title="8. Protection des données personnelles">
            <p>
              StatutPay collecte et traite des données personnelles dans le cadre de la fourniture de ses services,
              conformément à la <strong>loi n°2017-20 du 20 avril 2017</strong> portant code du numérique en République du Bénin.
            </p>
            <p><strong>Données collectées :</strong> nom, prénoms, adresse email, numéro de téléphone, pièce d'identité, données de connexion.</p>
            <p><strong>Finalités :</strong> gestion des comptes, traitement des campagnes, versement des rémunérations, prévention de la fraude.</p>
            <p><strong>Durée de conservation :</strong> les données sont conservées pendant toute la durée de la relation contractuelle, puis archivées pendant 5 ans conformément aux obligations légales.</p>
            <p>
              Vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant :
              <a href="mailto:privacy@statutpay.com" className="text-[#4c075b] hover:underline ml-1">privacy@statutpay.com</a>
            </p>
          </Section>

          <Section title="9. Responsabilité">
            <p>
              StatutPay met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme, mais ne peut garantir
              une disponibilité ininterrompue. StatutPay ne saurait être tenu responsable :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Du contenu des campagnes publicitaires soumises par les Annonceurs.</li>
              <li>Des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme.</li>
              <li>Des interruptions de service dues à des cas de force majeure (pannes réseau, catastrophes naturelles, etc.).</li>
            </ul>
          </Section>

          <Section title="10. Suspension et résiliation">
            <p>StatutPay se réserve le droit de suspendre ou résilier un compte sans préavis en cas de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Non-respect des présentes CGU.</li>
              <li>Fourniture d'informations fausses lors de l'inscription.</li>
              <li>Comportement frauduleux, abusif ou contraire à l'éthique de la plateforme.</li>
              <li>Diffusion de contenus illicites ou portant atteinte aux droits de tiers.</li>
            </ul>
            <p>
              L'utilisateur peut clôturer son compte à tout moment en adressant une demande à
              <a href="mailto:contact@statutpay.com" className="text-[#4c075b] hover:underline ml-1">contact@statutpay.com</a>.
              La clôture entraîne la perte des accès mais les données sont conservées selon les délais légaux.
            </p>
          </Section>

          <Section title="11. Droit applicable et litiges">
            <p>
              Les présentes CGU sont régies par le droit béninois. En cas de litige, les parties s'engagent à rechercher
              une solution amiable avant tout recours judiciaire.
            </p>
            <p>
              À défaut d'accord amiable, tout litige sera soumis à la compétence exclusive du
              <strong> Tribunal de Commerce de Cotonou</strong>, République du Bénin.
            </p>
          </Section>

          <Section title="12. Modification des CGU">
            <p>
              StatutPay se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
              de toute modification substantielle par email ou via une notification sur la plateforme.
              La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <Link to="/register"
              className="inline-block px-6 py-3 bg-[#4c075b] text-white text-sm font-semibold rounded-lg hover:-translate-y-0.5 transition-all duration-150">
              J'accepte et je crée mon compte
            </Link>
            <p className="text-xs text-red-600 mt-3">
              En créant un compte, vous confirmez avoir lu et accepté ces conditions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
