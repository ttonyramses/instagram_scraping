import configparser
import argparse
from instagram_hobby_analyzer import InstagramHobbyAnalyzer



# Lire les informations de connexion depuis le fichier config.ini
config = configparser.ConfigParser()
config.read('config.ini')

db_config = config['database']

# Construire l'URL de connexion à la base de données
DATABASE_URL = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"

analyzer = InstagramHobbyAnalyzer(DATABASE_URL)

# Création de l'analyseur
parser = argparse.ArgumentParser(description='Exécuter des fonctions spécifiques dans le script.')
parser.add_argument('-esc', '--export_scoring', nargs='+',
                    help='Exporter le scoring des users en fonctions des hobbies choisis')
parser.add_argument('-ak', '--add_keywords', nargs='+', help='Ajouter des mots clés à un hobby')
parser.add_argument('-sc', '--scoring', help='Exécuter la fonction qui défini le poid user/hobby', action='store_true')
parser.add_argument('-l', '--limit', type=int, default=2000, help="Limite le nombre de résultats exportés")

args = parser.parse_args()
# Traitement en fonction des arguments reçus
if args.add_keywords:
    hobby = args.add_keywords[0]
    keywords = args.add_keywords[1:]
    #add_keywords_to_hobby(hobby, keywords)

if args.scoring:
    analyzer.run()

if args.export_scoring:
    hobbies = args.export_scoring
    analyzer.get_top_users_by_hobbies(hobbies, top_n=args.limit)



