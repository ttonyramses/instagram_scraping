#!/bin/bash

export PATH=/home/tony/.nvm/versions/node/v20.11.1/bin:$PATH

# Chemin du dossier à vérifier
DIR="/home/tony/Dropbox/Notes/data/instagram_scraping/cookies"

# Commande à exécuter avec chaque fichier JSON comme paramètre
COMMAND="/home/tony/dev/psu-dev/instagram_scraping/start.sh  scrap-info --cookies "

# Générer le nom du fichier de log avec la date et l'heure actuelles
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/home/tony/dev/psu-dev/instagram_scraping/logs/daily/scrap_info_${TIMESTAMP}.log"

# Rediriger toutes les sorties standard et d'erreur vers le fichier de log
exec >> "$LOG_FILE" 2>&1

# Se placer dans le dossier
cd "$DIR" || { echo "Le dossier $DIR n'existe pas."; exit 1; }

# Liste des fichiers JSON
FILES=$(find . -maxdepth 1 -type f -name "*.json" | sort | sed 's|^\./||')

# Vérifier et traiter chaque fichier
for FILE in $FILES; do
    if [ -f "$FILE" ]; then

        echo "=================================================> traitement cookie $FILE";
        # Lancer la commande avec le fichier en paramètre
        $COMMAND "$FILE"
    fi
done
