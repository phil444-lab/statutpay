-- DropIndex
DROP INDEX `Campagne_annonceurId_fkey` ON `campagne`;

-- DropIndex
DROP INDEX `Campagne_categorieId_fkey` ON `campagne`;

-- DropIndex
DROP INDEX `Campagne_paysId_fkey` ON `campagne`;

-- DropIndex
DROP INDEX `Campagne_typeMediaId_fkey` ON `campagne`;

-- DropIndex
DROP INDEX `CampagneCategorieCiblage_categorieCiblageId_fkey` ON `campagnecategorieciblage`;

-- DropIndex
DROP INDEX `CampagneLocalite_localiteId_fkey` ON `campagnelocalite`;

-- DropIndex
DROP INDEX `CampagneMedia_campagneId_fkey` ON `campagnemedia`;

-- DropIndex
DROP INDEX `CampagneProfession_professionId_fkey` ON `campagneprofession`;

-- DropIndex
DROP INDEX `Localite_paysId_fkey` ON `localite`;

-- CreateTable
CREATE TABLE `Portefeuille` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `solde` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Portefeuille_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `portefeuilleId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `reference` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'en_attente',
    `description` VARCHAR(191) NULL,
    `modePaiement` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Transaction_reference_key`(`reference`),
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

-- AddForeignKey
ALTER TABLE `Portefeuille` ADD CONSTRAINT `Portefeuille_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_portefeuilleId_fkey` FOREIGN KEY (`portefeuilleId`) REFERENCES `Portefeuille`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
