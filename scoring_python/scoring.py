import sqlite3
import pandas as pd
import re
import unicodedata
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

import argparse

# Paramètres de connexion à votre base de données PostgreSQL
username = 'postgres'
password = 'postgres'
host = '192.168.1.146'  # typiquement 'localhost' si le serveur est local
port = '15432'  # le port par défaut de PostgreSQL
database = 'instagram_scraping_db'

# Création de l'URL de connexion
database_url = f"postgresql://{username}:{password}@{host}:{port}/{database}"



# Création d'une session
#Session = sessionmaker(bind=engine)
#session = Session()

def remove_accents_and_capitalize(text):
    # Normaliser le texte en décomposant les caractères accentués en caractères et signes diacritiques
    normalized_text = unicodedata.normalize('NFKD', text)
    
    # Filtrer pour retirer les signes diacritiques et convertir en majuscules
    unaccented_text = ''.join([char for char in normalized_text if not unicodedata.combining(char)])
    capitalized_text = unaccented_text.upper().strip()
    
    return capitalized_text

def add_keywords_to_hobby(hobby_name, keywords):
    # Connexion à la base de données PostgreSQL
    engine = create_engine(database_url)
    # Création d'une session
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        # Récupérer l'ID du hobby basé sur le nom
        hobby_name_normalized = remove_accents_and_capitalize(hobby_name)
        result = session.execute(text("SELECT id FROM hobby WHERE name = :name"), {'name': hobby_name_normalized})
        hobby_id = result.fetchone()

        if hobby_id is None:
            raise ValueError("Hobby not found")

        hobby_id = hobby_id[0]  # Déballer le résultat

        # Vérifier et préparer l'insertion des mots-clés qui ne sont pas déjà associés
        insert_data = []
        for keyword in keywords:
            keyword = keyword.strip()
            # Vérifier si le mot-clé existe déjà pour ce hobby
            exists = session.execute(text("""
                SELECT 1 FROM hobby_keywords WHERE hobby_id = :hobby_id AND keyword = :keyword
            """), {'hobby_id': hobby_id, 'keyword': keyword}).fetchone()
            if not exists:
                insert_data.append({'hobby_id': hobby_id, 'keyword': keyword})

        if not insert_data:
            print("No new keywords to add.")
            return

        # Insérer les nouveaux mots-clés dans la table hobby_keywords
        session.execute(text("INSERT INTO hobby_keywords (hobby_id, keyword) VALUES (:hobby_id, :keyword)"),
                        insert_data)
        session.commit()
        print("Keywords added successfully.")
        # Fermer la session
        session.close()

    except SQLAlchemyError as e:
        # En cas d'erreur, vous pouvez choisir de gérer les rollbacks ici ou à l'extérieur
        session.rollback()
        print("Error occurred:", e)
        raise

# Fonction pour créer le DataFrame final
def create_hobby_follower_df(data):
    # Compter les occurrences de chaque hobby pour chaque utilisateur
    hobby_count = data.groupby(['id_user', 'hobby']).size().unstack(fill_value=0)
    return hobby_count.reset_index()

def reshape_dataframe(result_df):
    # Si 'id_user' est déjà une colonne, utilisez directement, sinon réinitialisez l'index correctement
    if 'id_user' not in result_df.columns:
        result_df = result_df.reset_index().rename(columns={result_df.index.name: 'id_user'})

    # Utiliser melt pour transformer le DataFrame
    hobbies_columns = [col for col in result_df.columns if col != 'id_user']
    melted_df = pd.melt(result_df, id_vars=['id_user'], value_vars=hobbies_columns, var_name='hobby', value_name='occurrences')

    # Filtrer pour éliminer les lignes où le nombre d'occurrences est zéro
    #melted_df = melted_df[melted_df['occurrences'] > 0]
    melted_df = melted_df.reset_index()
    melted_df.drop('index', axis=1, inplace=True)

    return melted_df

def load_keywords_for_hobby(session, hobby_name):
    # Exécution de la requête SQL en utilisant SQLAlchemy
    query = """
    SELECT keyword FROM hobby_keywords 
    JOIN hobby ON hobby_keywords.hobby_id = hobby.id 
    WHERE hobby.name = :hobby_name
    """
    result = session.execute(text(query), {'hobby_name': hobby_name})
    keywords = [row[0] for row in result.fetchall()]
    return keywords

def check_keywords_in_text(text, keywords):
    text = "" if text is None else text
    # Normaliser et convertir le texte en minuscules
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii').lower()
    
    # Préparer les keywords en normalisant et convertissant en minuscules
    normalized_keywords = [unicodedata.normalize('NFKD', keyword).encode('ascii', 'ignore').decode('ascii').lower() for keyword in keywords]
    
    # Construire le pattern en utilisant les keywords normalisés
    pattern = r'\b(' + '|'.join(re.escape(keyword) for keyword in normalized_keywords) + r')\b'
    matches = re.findall(pattern, text)
    return len(matches)

def update_dataframe_with_bio_keywords(session, df):
    
    # Charger les mots-clés pour chaque hobby dans un dictionnaire
    hobby_keywords = {hobby: load_keywords_for_hobby(session, hobby) for hobby in df['hobby'].unique()}
    
    # Ajouter la colonne 'hobby_in_bio' initialisée à 0
    df['hobby_in_bio'] = 0

    # Parcourir chaque ligne du DataFrame
    for index, row in df.iterrows():
        # Récupérer la biographie de l'utilisateur
        query = """SELECT biography FROM "user" WHERE id = :user_id"""
        result = session.execute(text(query), {'user_id': row['id_user']})
        biography = result.fetchone()

        if biography:
            biography = biography[0]
            # Vérifier la présence des mots-clés pour le hobby de la ligne
            df.at[index, 'hobby_in_bio'] = check_keywords_in_text(biography, hobby_keywords[row['hobby']])
    
   
    return df

def hobby_id(engine):
    query = "SELECT id, name FROM hobby"
    hobby_ids = pd.read_sql_query(query, engine)

    # Afficher les IDs et noms pour vérifier
    return hobby_ids

def map_hobby_id(engine, df):
    hobby_ids = hobby_id(engine)
    # Créer un dictionnaire pour mapper les noms des hobbies à leurs IDs
    hobby_id_map = dict(zip(hobby_ids['name'], hobby_ids['id']))
    # Mettre à jour la colonne 'hobby' pour utiliser les IDs au lieu des noms
    df['hobby'] = df['hobby'].map(hobby_id_map)
    return df


from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text

def send_to_bdd(session, engine, df):

    try:
        df = map_hobby_id(engine, df)
        # Nouvel ordre des colonnes souhaité et renommage
        new_order = ['weight', 'hobby', 'id_user', 'occurrences', 'hobby_in_bio']
        new_names = {
            'id_user': 'userId',
            'hobby': 'hobbyId',
            'weight': 'score'
        }

        # Réorganiser les colonnes
        df = df[new_order]

        # Renommer les colonnes
        df.rename(columns=new_names, inplace=True)
        
        upsert_query = """
        INSERT INTO weighting ("userId", "hobbyId", score, occurrences, hobby_in_bio)
        VALUES (:userId, :hobbyId, :score, :occurrences, :hobby_in_bio)
        ON CONFLICT ("hobbyId", "userId") DO UPDATE SET
        score = EXCLUDED.score,
        occurrences = EXCLUDED.occurrences,
        hobby_in_bio = EXCLUDED.hobby_in_bio;
        """

        # Exécuter l'UPSERT pour chaque ligne du DataFrame
        for index, row in df.iterrows():
            session.execute(
                text(upsert_query),
                {
                    'userId': row['userId'],
                    'hobbyId': row['hobbyId'],
                    'score': row['score'],
                    'occurrences': row['occurrences'],
                    'hobby_in_bio': row['hobby_in_bio']
                }
            )
        session.commit()
        print("Scoring ajouté dans la base de données")

    except SQLAlchemyError as e:
        # En cas d'erreur, vous pouvez choisir de gérer les rollbacks ici ou à l'extérieur
        session.rollback()
        print("Error occurred:", e)
        raise

def weighting_profil(session, data):
    reshape_data = reshape_dataframe(create_hobby_follower_df(data))
    df = update_dataframe_with_bio_keywords(session, reshape_data)
    df['weight'] = df['occurrences'] + 5 * df['hobby_in_bio']
    return df
#####################################################################################
#####################################################################################
def let_scoring():
    # Connexion à la base de données PostgreSQL
    engine = create_engine(database_url)

    # Requête SQL pour récupérer les informations nécessaires
    query = """
    SELECT uf.follower_id AS id_user, h.name AS hobby
    FROM user_followers uf
    JOIN user_hobby uh ON uf.user_id = uh.user_id
    JOIN hobby h ON uh.hobby_id = h.id
    LIMIT 100
    """
    # Exécution de la requête SQL et chargement des données dans un DataFrame
    data = pd.read_sql_query(query, engine)

    # Création d'une session
    Session = sessionmaker(bind=engine)
    session = Session()

    df = weighting_profil(session, data)
    send_to_bdd(session, engine, df)
    # Fermer la session
    session.close()


def get_users_with_high_scores(df, hobbies):
    # Utiliser le DataFrame original, vérifier le maximum sur les colonnes de hobbies spécifiées
    high_score_users = df[df[hobbies].max(axis=1) > 0]
    
    # Retourner le DataFrame filtré avec tous les utilisateurs ayant un score supérieur à 0 dans un des hobbies
    return high_score_users


def extract_user_scoring(hobbies):
    engine = create_engine(database_url)
    hobbies = [remove_accents_and_capitalize(hobby) for hobby in hobbies]
    hobbies.append("CHRETIEN")
    query = """
    SELECT
        w."userId",
        h.name AS hobby_name,  -- Remplace hobbyId par le nom du hobby
        w.score
    FROM
        weighting w
    JOIN
        hobby h ON w."hobbyId" = h.id;
    """
    data = pd.read_sql_query(query, engine)
    # Pivoter le DataFrame
    pivot_df = data.pivot_table(index='userId', columns='hobby_name', values='score', fill_value=0)

    # Réinitialiser l'index pour ramener 'id_user' en tant que colonne
    pivot_df.reset_index(inplace=True)
    pivot_df = get_users_with_high_scores(pivot_df, hobbies)
    hobbies.insert(0, 'userId')
    df = pivot_df[hobbies]
    sorted_df = df.sort_values(by='CHRETIEN', ascending=False)
    sorted_df.to_excel('output_inst.xlsx', index=False, engine='openpyxl')




# Création de l'analyseur
parser = argparse.ArgumentParser(description='Exécuter des fonctions spécifiques dans le script.')


parser.add_argument('-esc', '--export_scoring', nargs='*', help='Exporter le scoring des users en fonctions des hobbies choisis')
parser.add_argument('-ak', '--add_keywords', nargs='+', help='Ajouter des mots clés à un hobby')
parser.add_argument('-sc', '--scoring', help='Exécuter la fonction qui défini le poid user/hobby', action='store_true')

# Analyser les arguments
args = parser.parse_args()

if args.export_scoring:
    hobbies = args.export_scoring[0:]
    if hobbies is None:
        extract_user_scoring([])
    else:
        extract_user_scoring(hobbies)

if args.add_keywords:
    hobby = args.add_keywords[0]
    keywords = args.add_keywords[1:]
    add_keywords_to_hobby(hobby, keywords)

if args.scoring:
    let_scoring()


#pip install openpyxl
#pip install psycopg2
#pip install sqlalchemy
#pip install numpy
#pip install pandas
#python .\scoring.py --add_keywords chretien "disciple" "jésus"
    
    
