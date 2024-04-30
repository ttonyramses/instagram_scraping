#!/bin/bash

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé sur ce système."
    read -p "Voulez-vous installer Node.js ? (O/N) : " install
    if [ "$install" = "O" ] || [ "$install" = "o" ]; then
        echo "Redirigez-vous vers le site de Node.js pour l'installation..."
        xdg-open "https://nodejs.org/"
    else
        exit 1
    fi
fi

# Se placer dans le dossier courant
cd "$(dirname "$0")"

# Lancer le fichier main.js s'il existe
if [ -f "dist/main.js" ]; then
    node dist/main.js $@
else
    echo "Le fichier dist/main.js n'existe pas dans ce répertoire."
fi
