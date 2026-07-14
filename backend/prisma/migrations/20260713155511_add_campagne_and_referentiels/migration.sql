-- CreateTable
CREATE TABLE `Pays` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Pays_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `paysId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategorieCiblage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TypeMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TypeMedia_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategorieCampagne` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CategorieCampagne_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campagne` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `heureDiffusion` VARCHAR(191) NOT NULL,
    `budget` DOUBLE NOT NULL,
    `montantParVue` DOUBLE NOT NULL DEFAULT 2.5,
    `ageMin` INTEGER NOT NULL DEFAULT 18,
    `ageMax` INTEGER NOT NULL DEFAULT 99,
    `legende` TEXT NULL,
    `statut` ENUM('en_attente', 'actif', 'cloture', 'rejete') NOT NULL DEFAULT 'en_attente',
    `annonceurId` INTEGER NOT NULL,
    `paysId` INTEGER NULL,
    `typeMediaId` INTEGER NULL,
    `categorieId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampagneLocalite` (
    `campagneId` INTEGER NOT NULL,
    `localiteId` INTEGER NOT NULL,

    PRIMARY KEY (`campagneId`, `localiteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampagneProfession` (
    `campagneId` INTEGER NOT NULL,
    `professionId` INTEGER NOT NULL,

    PRIMARY KEY (`campagneId`, `professionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampagneCategorieCiblage` (
    `campagneId` INTEGER NOT NULL,
    `categorieCiblageId` INTEGER NOT NULL,

    PRIMARY KEY (`campagneId`, `categorieCiblageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampagneMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campagneId` INTEGER NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `mimetype` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Localite` ADD CONSTRAINT `Localite_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campagne` ADD CONSTRAINT `Campagne_annonceurId_fkey` FOREIGN KEY (`annonceurId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campagne` ADD CONSTRAINT `Campagne_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campagne` ADD CONSTRAINT `Campagne_typeMediaId_fkey` FOREIGN KEY (`typeMediaId`) REFERENCES `TypeMedia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campagne` ADD CONSTRAINT `Campagne_categorieId_fkey` FOREIGN KEY (`categorieId`) REFERENCES `CategorieCampagne`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneLocalite` ADD CONSTRAINT `CampagneLocalite_campagneId_fkey` FOREIGN KEY (`campagneId`) REFERENCES `Campagne`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneLocalite` ADD CONSTRAINT `CampagneLocalite_localiteId_fkey` FOREIGN KEY (`localiteId`) REFERENCES `Localite`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneProfession` ADD CONSTRAINT `CampagneProfession_campagneId_fkey` FOREIGN KEY (`campagneId`) REFERENCES `Campagne`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneProfession` ADD CONSTRAINT `CampagneProfession_professionId_fkey` FOREIGN KEY (`professionId`) REFERENCES `Profession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneCategorieCiblage` ADD CONSTRAINT `CampagneCategorieCiblage_campagneId_fkey` FOREIGN KEY (`campagneId`) REFERENCES `Campagne`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneCategorieCiblage` ADD CONSTRAINT `CampagneCategorieCiblage_categorieCiblageId_fkey` FOREIGN KEY (`categorieCiblageId`) REFERENCES `CategorieCiblage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampagneMedia` ADD CONSTRAINT `CampagneMedia_campagneId_fkey` FOREIGN KEY (`campagneId`) REFERENCES `Campagne`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
