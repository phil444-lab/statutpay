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

-- DropIndex
DROP INDEX `Transaction_portefeuilleId_fkey` ON `transaction`;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `fedapayStatus` VARCHAR(191) NULL;

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
