# VENT

Feedback log. Repeated/systemic workflow friction that should become future automation, docs, or workflow fixes.

## 26-09-18 19:28 — formatter churn + read-time redaction ambiguity

Un formateur externe réécrit répétitivement les fichiers (miens et six fichiers sans rapport) après chaque commit. Chaque tour, `git diff --stat` montre des centaines de lignes de reformatage pur : il faut relire les fichiers, vérifier que le diff n'est que du formatage, et distinguer mes modifications réelles des six changements préexistants. Effet : temps gaspillé et risque de committer du bruit ou d'attribuer par erreur un changement. Correctif souhaité : exécuter le formateur une fois, explicitement, sur des chemins choisis (ou désactiver la réécriture automatique en session), et signaler clairement quels fichiers ont été réécrits et pourquoi. Aussi : la redaction d'affichage du lecteur a remplacé à l'écran une chaîne de token synthétique par `[REDACTED:Bearer token]`, ce qui ressemble à une corruption du fichier sur disque. Afficher un marqueur explicite (par ex. « affichage masqué, fichier intact ») éviterait une vérification d'intégrité inutile.
