# Configuration Payouts FedaPay

## Problème identifié

L'erreur 403 "Opération non autorisée" lors de la création de payouts indique que **votre clé API sandbox FedaPay n'a pas les permissions pour les payouts**.

## Diagnostic

Le code est correctement configuré :
- ✅ Format des données conforme à la documentation FedaPay
- ✅ Customer avec objet complet (firstname, lastname, email, phone_number)
- ✅ Numéro de téléphone au format international (+229...)
- ✅ Mode `mtn_open` pour détection automatique de l'opérateur
- ✅ Headers d'authentification corrects

## Solutions

### Solution 1 : Contacter FedaPay (Recommandé)

Contactez le support FedaPay pour :
1. Activer les permissions de payout sur votre compte sandbox
2. Vérifier que votre clé API a les droits nécessaires
3. Obtenir une clé API avec permissions payouts

**Email support** : support@fedapay.com
**Dashboard** : https://dashboard.fedapay.com

### Solution 2 : Tester avec l'endpoint de diagnostic

Utilisez l'endpoint de test pour vérifier votre connexion :

```bash
GET /api/portefeuille/test-fedapay
```

Cet endpoint teste :
- La connexion au compte FedaPay
- La création de customer
- Les permissions de base

### Solution 3 : Mode manuel temporaire

Le système est déjà configuré pour fonctionner en mode dégradé :
- Le retrait est effectué dans la base de données
- Le solde est déduit
- L'erreur est retournée à l'utilisateur avec un message clair
- Vous pouvez traiter les payouts manuellement depuis le dashboard FedaPay

## Vérification

Après activation des permissions par FedaPay :

1. Redémarrez le serveur
2. Testez un retrait
3. Vérifiez les logs console :
   ```
   ✓ Payout FedaPay créé: {...}
   ✓ Payout envoyé: {...}
   ```

## Logs de diagnostic

Les logs suivants sont affichés lors d'un payout :
- Numéro de téléphone formaté
- Données du payout envoyées
- Réponse de FedaPay
- Erreurs détaillées en cas d'échec

## Contact

Si le problème persiste après activation des permissions :
1. Vérifiez les logs console
2. Utilisez l'endpoint `/api/portefeuille/test-fedapay`
3. Contactez FedaPay avec les logs d'erreur