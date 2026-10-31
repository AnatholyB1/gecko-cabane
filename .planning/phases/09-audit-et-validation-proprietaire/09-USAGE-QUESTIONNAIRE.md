# Questionnaire d'usage de l'admin (AUDIT-04)

**NON ENVOYÉ.** Rédigé pour envoi par WhatsApp à la cheffe et aux serveurs, **sur accord du propriétaire** (tout message à un tiers exige son feu vert). Rien n'a été envoyé à personne.

**Mode d'emploi pour le propriétaire**
- Copier-coller chaque bloc tel quel dans WhatsApp (les `*mots*` s'affichent en gras). Durée de réponse visée : 3 minutes, réponses courtes ou **message vocal** acceptés.
- Bloc A : cheffe. Bloc B : serveurs (un message par personne). Bloc C : propriétaire (et développeur). Les questions 4 et 5 du bloc C sont celles qui décident de la suppression de la saisie des totaux d'avis et du processus d'invitation d'admin.
- Si une personne ne lit pas bien le français, faire traduire le bloc en thaï ou en anglais **par une personne de confiance** avant envoi (non traduit ici, pour ne pas inventer de texte).
- Recopier les réponses dans la section « Réponses » en bas de ce fichier : c'est cette section qui constitue le retour exigé par AUDIT-04.

---

## Bloc A : à envoyer à la cheffe

> Bonjour Jariya, nous préparons une nouvelle version de l'administration du site (la page où vous consultez les réservations et modifiez la carte). Pour la faire utile et simple, nous avons besoin de votre avis. 3 minutes, un vocal suffit. Merci !
>
> *1.* Quand vous ouvrez l'admin sur votre téléphone, *que regardez-vous ou faites-vous en premier ?* (voir qui vient ce soir, confirmer des réservations, changer un prix, autre)
>
> *2.* *À quelle fréquence* l'ouvrez-vous ? (plusieurs fois par jour / une fois par jour / chaque semaine / rarement)
>
> *3.* *Qu'est-ce qui vous gêne ou vous fait perdre du temps ?* (trop de clics, texte trop petit, boutons difficiles à toucher, page lente, autre)
>
> *4.* *Qu'est-ce que vous n'utilisez jamais ?* (par exemple le plan de salle, les horaires, l'annonce, les avis, le rapport du lundi)
>
> *5.* Pour la carte : *quand vous changez un prix ou qu'un plat n'est plus disponible, qu'est-ce qui est compliqué ?* Réorganisez-vous l'ordre des plats sur le téléphone ?
>
> *6.* Pour vous, *qu'est-ce qui manque* sur l'écran du jour ? (heure d'arrivée, nombre de couverts, téléphone du client, WhatsApp, notes, allergies)
>
> *7.* Utilisez-vous les modèles de message WhatsApp pour demander un avis aux clients ? Si oui, lequel (français, anglais, allemand) ?

---

## Bloc B : à envoyer à chaque serveur

> Bonjour, nous refaisons l'administration du site que vous utilisez sur la tablette. Pouvez-vous répondre en quelques mots (ou en vocal) ? Merci !
>
> *1.* Pendant le service, *que faites-vous dans l'admin ?* (confirmer, annuler, marquer « absent », ajouter une réservation reçue par téléphone, regarder les notes)
>
> *2.* *Qu'est-ce qui est lent ou énervant ?* (boutons trop petits, trop de clics, la page se recharge, on ne voit pas l'heure, autre)
>
> *3.* *Qu'est-ce que vous n'utilisez jamais ?* (le plan de salle pour placer les clients, la recherche, les filtres, la vue semaine)
>
> *4.* Placez-vous les clients sur le plan de salle dans l'admin, ou à l'oral / sur papier ?
>
> *5.* Quand un client appelle pour réserver, *combien de temps* prend l'ajout de la réservation ? Que faudrait-il pour que ce soit plus rapide ?
>
> *6.* Sur la tablette, *pouvez-vous toucher les boutons sans vous tromper* ? Y a-t-il des boutons que vous touchez par erreur ?

---

## Bloc C : à envoyer au propriétaire (et à demander au développeur)

> Trois questions pour décider ce qu'on supprime :
>
> *1.* Les *totaux d'avis du mois* (Google et TripAdvisor) que l'on saisit à la main dans la page « Avis » : *qui les saisit, à quelle fréquence, et à quelle date a eu lieu la dernière saisie ?* Quelqu'un les lit-il ailleurs (un tableau, un document, un autre outil) ?
>
> *2.* Le *rapport du lundi* donne déjà le total d'avis Google automatiquement et le rang TripAdvisor. Le *nombre d'avis TripAdvisor* (pas le rang) vous est-il utile ? Si oui, souhaitez-vous le garder en saisie manuelle ?
>
> *3.* *Aujourd'hui, comment ajoute-t-on un nouvel administrateur ?* (qui crée le compte, où, combien de temps cela prend) Y a-t-il une personne à ajouter prochainement ?
>
> *4.* Le *plan de salle* : confirmez-vous qu'on peut le supprimer de l'admin (les tables restent en base, rien n'est effacé) ?
>
> *5.* Supprimer une réservation définitivement : vous en servez-vous, ou « Annuler » suffit-il ?

---

## Lecture des réponses (pour l'analyse, ne pas envoyer)

| Question | Ce que la réponse décide | Où dans l'audit |
|----------|--------------------------|------------------|
| A1, A2, B1 | Contenu de l'écran « Aujourd'hui » et ordre de la navigation | `09-NAVIGATION-CIBLE.md` |
| A4, B3, B4 | Fonctions à supprimer (plan de salle, vue semaine, filtres) | `09-AUDIT.md` §2 |
| A3, B2, B6 | Cibles tactiles, densité, boutons à agrandir | `09-BRIEF-DESIGN.md` §5 |
| A5 | Boutons monter / descendre à la place du glisser-déposer | `09-AUDIT.md` §2.4-2.5 |
| A7, C1, C2 | Retrait ou conservation de la saisie manuelle des totaux d'avis (REP-03) | `09-AUDIT.md` §3 |
| C3 | Processus d'invitation d'un admin avant suppression de `/admin/signup` (ACC-02) | `09-AUDIT.md` §2.12 |
| C4, C5 | Confirmation des suppressions (TAB-02, dialogue de suppression) | `09-AUDIT.md` §2.3, §5.4 |

## Réponses (à compléter après envoi, avec la date)

| Qui | Date | Réponse résumée |
|-----|------|-----------------|
| Cheffe (Bloc A) | | |
| Serveur 1 (Bloc B) | | |
| Serveur 2 (Bloc B) | | |
| Propriétaire (Bloc C) | | |
| Développeur (Bloc C, Q1 et Q3) | | |

**État de la saisie manuelle des totaux d'avis :** (à compléter) · **État du flux d'invitation d'admin :** (à compléter)

*Critère de clôture AUDIT-04 : au moins la cheffe, un serveur et le propriétaire ont répondu, et les deux lignes ci-dessus sont renseignées. Sans réponse, la phase 9 peut avancer avec les verdicts par défaut du document d'audit, en le notant dans `09-OWNER-VALIDATION.md`.*
