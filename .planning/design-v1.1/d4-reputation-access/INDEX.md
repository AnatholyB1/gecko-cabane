# D4 : Réputation, connexion et accès (v1.1)

Branche `design/d4-reputation-access`. Prototypes HTML/CSS statiques, aucun code applicatif, aucun envoi. Ouvrir les `.html` directement dans un navigateur. Captures Playwright dans `captures/` (`{page}-{390|768|1440}.png`, 390 en DPR 2).

## Documents
- `D4-DESIGN-CONTRACT.md` : tokens, variantes, états, microcopie, responsive, mouvement, accessibilité, mesures, tableau exigence / écran / vérification, libellés TEST/live conservés.
- `D4-CRITIQUE.md` : constats, faiblesses, 5 questions ouvertes.
- `tokens.css` (jetons partagés + extensions D4), `admin.css` (styles des maquettes).
- `tools-build.mjs` (génère les HTML ; argument : dossier de sortie) et `tools-measure.mjs` (mesures et captures ; nécessite `playwright-core` et `axe-core` installés hors du dépôt, ex. `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-d4`).

## Écrans (REP-01..03)
| Fichier | État |
|---|---|
| `reputation-avis.html` | Données (exemples) |
| `reputation-avis-chargement.html` / `-vide.html` / `-erreur.html` | Chargement / vide / erreur |
| `reputation-avis-enregistre.html` / `-invalide.html` | Totaux enregistrés / saisie invalide |
| `reputation-kpi.html` | Données (exemples), garde-fou, envoi, historique, détail |
| `reputation-kpi-chargement.html` / `-vide.html` / `-erreur.html` | Chargement / vide / erreur |
| `reputation-kpi-dialogue-test.html` | Dialogue de confirmation d'envoi TEST (ouvert) |
| `reputation-kpi-dialogue-alerte.html` | Dialogue d'alerte note <= 3 (ouvert) |

## Connexion et accès (ACC-02)
| Fichier | État |
|---|---|
| `login.html` | Défaut |
| `login-erreur.html` / `-acces.html` / `-envoi.html` / `-deconnecte.html` | Identifiants incorrects / compte sans accès / envoi / déconnecté |
| `invitation.html` | Gestion des accès : formulaire + liste |
| `invitation-chargement.html` / `-vide.html` / `-erreur.html` | Chargement / seul admin / erreur |
| `invitation-envoyee.html` / `-erreur-envoi.html` / `-invalide.html` / `-dialogue.html` | Envoyée / échec / email invalide / dialogue d'envoi |
| `invitation-accepter.html` | Page publique : choisir son mot de passe |
| `invitation-accepter-invalide.html` / `-envoi.html` / `-ok.html` | Refusé / création / succès |
| `invitation-expiree.html` | Lien expiré ou utilisé |

## Erreurs
`erreurs.html` (404), `erreurs-500.html`, `erreurs-403.html`, `erreurs-hors-ligne.html`.

## Mesures (dernier passage)
102 combinaisons (34 pages x 3 largeurs) : 0 débordement, 0 texte < 14 px, 0 cible < 44 px, 0 contraste < AA, 0 violation axe-core.
