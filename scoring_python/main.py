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
# Ajouter une sous-commande 'add-keyword'
subparsers = parser.add_subparsers(dest='command', help='Sous-commandes')

# Créer le parser pour la commande 'add-keyword'
parser_add_keyword = subparsers.add_parser('add-keyword', help="Ajouter des keywords avec un hobby")
parser_export_user = subparsers.add_parser('export_scoring', help="Exporter le scoring des users en fonctions des hobbies choisis")
parser_scoring = subparsers.add_parser('scoring', help="Calcul du poid ou score de chaque user/hobby")

parser_add_keyword.add_argument('--keyword', required=True, help="Dictionnaire de keywords avec leur valeur", type=str)
parser_add_keyword.add_argument('--hobby', required=True, help="Hobby associé", type=str)
parser_export_user.add_argument('--hobbies', required=True, help="Liste de hobbies", nargs='+', type=str)
parser_export_user.add_argument('-l', '--limit', type=int, default=2000, help="Limite le nombre de résultats exportés")

args = parser.parse_args()
# Traitement en fonction des arguments reçus
if args.command == 'add-keyword':
    keywords = eval(args.keyword)
    analyzer.add_or_update_keywords(args.hobby, keywords)

elif args.command == 'scoring':
    analyzer.update_scoring()

elif args.command == 'export_scoring':
    analyzer.export_top_users_by_hobbies(args.hobbies, top_n=args.limit)



