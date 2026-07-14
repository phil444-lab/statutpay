import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Pays + Localités
  const pays = [
    { 
      code: "bj", 
      label: "Bénin", 
      localites: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Natitingou", "Ouidah", "Lokossa", "Djougou", "Kandi", "Allada", "Das-Zoumé", "Savalou", "Comé", "Grand-Popo", "Malanville", "Banikoara", "Nikki", "Tchaourou", "Tanguiéta", "Pobé", "Kétou", "Aplahoué", "Dogbo", "Covè", "Bembéréké", "Bassila"] 
    },
    { 
      code: "sn", 
      label: "Sénégal", 
      localites: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbacké", "Mbour", "Rufisque", "Pikine", "Guédiawaye", "Diourbel", "Louga", "Tambacounda", "Kolda", "Richard-Toll", "Tivaouane", "Joal-Fadiouth", "Kaffrine", "Matam", "Fatick", "Bignona", "Vélingara"] 
    },
    { 
      code: "ci", 
      label: "Côte d'Ivoire", 
      localites: ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo", "Man", "Gagnoa", "Abengourou", "Anyama", "Odienné", "Divo", "Soubré", "Agboville", "Bingerville", "Grand-Bassam", "Seguela", "Ferkessédougou", "Katiola", "Bondoukou", "Bouaflé", "Oumé"] 
    },
    { 
      code: "ml", 
      label: "Mali", 
      localites: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Gao", "Tombouctou", "Koutiala", "Kati", "Kalabancoro", "San", "Bougouni", "Kita", "Koulikoro", "Nioro du Sahel", "Nara", "Djenné", "Ménaka", "Kidal"] 
    },
    { 
      code: "bf", 
      label: "Burkina Faso", 
      localites: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya", "Fada N'gourma", "Tenkodogo", "Houndé", "Dédougou", "Dori", "Orodara", "Réo", "Kongoussi", "Yako", "Djibo", "Manga", "Pô", "Koupéla", "Garango"] 
    },
    { 
      code: "tg", 
      label: "Togo", 
      localites: ["Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé", "Dapaong", "Tsévié", "Aného", "Kpatchi", "Notsé", "Mango", "Bafilo", "Tabligbo", "Kandé", "Badou", "Sotouboua", "Vogan", "Elavagnon"] 
    },
    { 
      code: "ne", 
      label: "Niger", 
      localites: ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso", "Diffa", "Tillabéri", "Gaya", "Madaoua", "Birni N'Konni", "Dogondoutchi", "Tessaoua", "Guidan Roumdji", "Mayahi", "Tera", "Tanout"] 
    },
    { 
      code: "cm", 
      label: "Cameroun", 
      localites: ["Yaoundé", "Douala", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Ngaoundéré", "Bertoua", "Buea", "Ebolowa", "Kribi", "Limbe", "Dschang", "Foumban", "Nkongsamba", "Edéa", "Kousseri", "Guider", "Yagoua", "Meiganga", "Kumbo"] 
    },
  ];

  for (const p of pays) {
    const created = await prisma.pays.upsert({
      where: { code: p.code },
      update: { label: p.label },
      create: { code: p.code, label: p.label },
    });
    for (const loc of p.localites) {
      await prisma.localite.upsert({
        where: { id: (await prisma.localite.findFirst({ where: { label: loc, paysId: created.id } }))?.id ?? 0 },
        update: {},
        create: { label: loc, paysId: created.id },
      });
    }
  }

  // Professions
  const professions = ["Agriculteur", "Commerçant", "Enseignant", "Médecin", "Ingénieur", "Artisan", "Fonctionnaire", "Étudiant", "Entrepreneur", "Journaliste", "Avocat", "Comptable", "Infirmier", "Architecte", "Chauffeur"];
  for (const label of professions) {
    await prisma.profession.upsert({
      where: { id: (await prisma.profession.findFirst({ where: { label } }))?.id ?? 0 },
      update: {},
      create: { label },
    });
  }

  // Catégories de ciblage
  const categoriesCiblage = [
    "ACTUALITE, ONG & SOCIETE",
    "AGRICULTURE, ELEVAGE & PECHE",
    "ALIMENTATION & BOISSONS",
    "ALIMENTATION & PRODUITS LOCAUX",
    "ANIMAUX & NATURE",
    "APPLICATIONS & SERVICES DIGITAUX",
    "AUTOMOBILE & MOTO",
    "AUTOMOBILE & TRANSPORTS",
    "BEAUTE & COSMETIQUES",
    "BOISSONS & BRASSERIE",
    "CEREMONIES & EVENEMENTS",
    "CINEMA & SERIES",
    "CINEMA, SERIES & STREAMING",
    "COIFFURE & SOINS CAPILLAIRES",
    "COMMERCE, IMPORT-EXPORT & GROS",
    "CREDIT, EPARGNE & ASSURANCE",
    "CULTURE & ART",
    "CULTURE, ARTS & ARTISANAT",
    "EDUCATION & FORMATION",
    "EDUCATION SCOLAIRE",
    "EMPLOI & RECRUTEMENT",
    "ENERGIE SOLAIRE & ELECTRICITE",
    "ENTREPRENEURIAT & START-UP",
    "ENTREPREUNARIAT & BUSINESS",
    "EVENEMENTS & VIE SOCIALE",
    "FINANCE & BANQUE",
    "FITNESS & SPORT-SANTE",
    "FORMATION PROFESSIONNELLE",
    "GAMING & DIVERTISSEMENT MOBILE",
    "GAMING",
    "IMMOBILIER & CONSTRUCTION",
    "IMMOBILIER",
    "MAISON & DECORATION",
    "MAISON, MEUBLES & ELECTROMENAGER",
    "MOBILE MONEY & TRANSFERTS",
    "MODE & BEAUTE",
    "MODE & HABILLEMENT",
    "MUSIQUE & DIVERTISSEMENT",
    "MUSIQUE AFRICAINE & CONCERTS",
    "POLITIQUE & SOCIETE",
    "RELIGION & SPIRITUALITE",
    "RELIGION, EGLISES & SPIRITUALITE",
    "RESTAURATION & LIVRAISON REPAS",
    "SANTE & BIEN-ETRE",
    "SANTE & MEDECINE",
    "SMARTPHONES & HIGH-TECH",
    "SPORT & FITNESS",
    "SPORT & PARIS SPORTIFS",
    "TECHNOLOGIE & MOBILE",
    "TRANSPORT & LOGISTIQUE",
    "VOYAGES & TOURISME",
  ];
  for (const label of categoriesCiblage) {
    await prisma.categorieCiblage.upsert({
      where: { id: (await prisma.categorieCiblage.findFirst({ where: { label } }))?.id ?? 0 },
      update: {},
      create: { label },
    });
  }

  // Types de média
  const typesMedia = [
    { code: "image", label: "Image" },
    { code: "video", label: "Vidéo" },
    { code: "image_texte", label: "Image + Texte" },
  ];
  for (const t of typesMedia) {
    await prisma.typeMedia.upsert({
      where: { code: t.code },
      update: { label: t.label },
      create: t,
    });
  }

  // Catégories de campagne
  const categoriesCampagne = [
    { code: "promotion", label: "Promotion" },
    { code: "evenement", label: "Événement" },
    { code: "information", label: "Information" },
    { code: "fidelisation", label: "Fidélisation" },
    { code: "recrutement", label: "Recrutement" },
    { code: "sensibilisation", label: "Sensibilisation" },
  ];
  for (const c of categoriesCampagne) {
    await prisma.categorieCampagne.upsert({
      where: { code: c.code },
      update: { label: c.label },
      create: c,
    });
  }

  console.log("✅ Seed terminé avec succès");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
