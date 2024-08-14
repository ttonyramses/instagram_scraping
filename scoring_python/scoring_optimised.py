import functools
import time

import pandas as pd
import argparse
import re
import unicodedata
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import configparser


# Lire les informations de connexion depuis le fichier config.ini
config = configparser.ConfigParser()
config.read('config.ini')

db_config = config['database']

# Construire l'URL de connexion à la base de données
DATABASE_URL = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"

def log_time(message):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def log_execution_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"Function '{func.__name__}' executed in {execution_time:.4f} seconds")
        return result

    return wrapper

def create_session():
    """Crée et retourne une session SQLAlchemy."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session(), engine



def remove_accents_and_capitalize(text):
    normalized_text = unicodedata.normalize('NFKD', text)
    unaccented_text = ''.join([char for char in normalized_text if not unicodedata.combining(char)])
    return unaccented_text.upper().strip()



@log_execution_time
def add_keywords_to_hobby(hobby_name, keywords):
    session, _ = create_session()
    try:
        hobby_name_normalized = remove_accents_and_capitalize(hobby_name)
        result = session.execute(text("SELECT id FROM hobby WHERE name = :name"), {'name': hobby_name_normalized})
        hobby_id = result.scalar()

        if hobby_id is None:
            raise ValueError("Hobby not found")

        insert_data = [{'hobby_id': hobby_id, 'keyword': keyword.strip()} for keyword in keywords]
        if not insert_data:
            print("No new keywords to add.")
            return

        session.execute(
            text("INSERT INTO hobby_keywords (hobby_id, keyword) VALUES (:hobby_id, :keyword)"),
            insert_data
        )
        session.commit()
        print("Keywords added successfully.")
    except SQLAlchemyError as e:
        session.rollback()
        print("Error occurred:", e)
    finally:
        session.close()



@log_execution_time
def create_hobby_follower_df(data):
    hobby_count = data.groupby(['id_user', 'hobby']).size().unstack(fill_value=0)
    return hobby_count.reset_index()


@log_execution_time
def reshape_dataframe(result_df):
    if 'id_user' not in result_df.columns:
        result_df = result_df.reset_index().rename(columns={result_df.index.name: 'id_user'})

    hobbies_columns = [col for col in result_df.columns if col != 'id_user']
    melted_df = pd.melt(result_df, id_vars=['id_user'], value_vars=hobbies_columns, var_name='hobby',
                        value_name='occurrences')

    melted_df = melted_df[melted_df['occurrences'] > 0]
    return melted_df.reset_index(drop=True)


def load_keywords_for_hobby(session, hobby_name):
    query = """
    SELECT keyword FROM hobby_keywords 
    JOIN hobby ON hobby_keywords.hobby_id = hobby.id 
    WHERE hobby.name = :hobby_name
    """
    result = session.execute(text(query), {'hobby_name': hobby_name})
    return [row[0] for row in result.fetchall()]


def check_keywords_in_text(text, keywords):
    text = unicodedata.normalize('NFKD', text or "").encode('ascii', 'ignore').decode('ascii').lower()
    normalized_keywords = [unicodedata.normalize('NFKD', keyword).encode('ascii', 'ignore').decode('ascii').lower() for
                           keyword in keywords]

    pattern = r'\b(' + '|'.join(re.escape(keyword) for keyword in normalized_keywords) + r')\b'
    return len(re.findall(pattern, text))


@log_execution_time
def update_dataframe_with_bio_keywords(session, df):
    hobby_keywords = {hobby: load_keywords_for_hobby(session, hobby) for hobby in df['hobby'].unique()}
    bios = session.execute(text("""SELECT id, biography FROM "user" WHERE id IN :ids"""),
                           {'ids': tuple(df['id_user'].unique())}).fetchall()

    bios_dict = {user_id: bio for user_id, bio in bios}
    df['hobby_in_bio'] = df.apply(
        lambda row: check_keywords_in_text(bios_dict.get(row['id_user'], ""), hobby_keywords[row['hobby']]), axis=1)
    return df


def map_hobby_id(engine, df):
    hobby_ids = pd.read_sql_query("SELECT id, name FROM hobby", engine)
    hobby_id_map = dict(zip(hobby_ids['name'], hobby_ids['id']))
    df['hobby'] = df['hobby'].map(hobby_id_map)
    return df


@log_execution_time
def send_to_bdd(session, engine, df):
    try:
        df = map_hobby_id(engine, df)
        df = df[df['weight'] > 0]
        df = df[['weight', 'hobby', 'id_user', 'occurrences', 'hobby_in_bio']].rename(columns={
            'id_user': 'userId',
            'hobby': 'hobbyId',
            'weight': 'score'
        })

        upsert_query = """
        INSERT INTO weighting ("userId", "hobbyId", score, occurrences, hobby_in_bio)
        VALUES (:userId, :hobbyId, :score, :occurrences, :hobby_in_bio)
        ON CONFLICT ("hobbyId", "userId") DO UPDATE SET
        score = EXCLUDED.score,
        occurrences = EXCLUDED.occurrences,
        hobby_in_bio = EXCLUDED.hobby_in_bio;
        """
        session.execute(text(upsert_query), df.to_dict(orient='records'))
        session.commit()
        print("Scoring ajouté dans la base de données")
    except SQLAlchemyError as e:
        session.rollback()
        print("Error occurred:", e)
    finally:
        session.close()


def weighting_profil(session, data):
    reshape_data = reshape_dataframe(create_hobby_follower_df(data))
    df = update_dataframe_with_bio_keywords(session, reshape_data)
    df['weight'] = df['occurrences'] + 5 * df['hobby_in_bio']
    return df


def let_scoring():
    log_time("Début du traitement de scoring des utilisateurs.")
    engine = create_engine(DATABASE_URL)
    query = """
    SELECT uf.follower_id AS id_user, h.name AS hobby
    FROM user_followers uf
    JOIN user_hobby uh ON uf.user_id = uh.user_id
    JOIN hobby h ON uh.hobby_id = h.id
    """
    data = pd.read_sql_query(query, engine)
    session = sessionmaker(bind=engine)()
    df = weighting_profil(session, data)
    send_to_bdd(session, engine, df)
    log_time("Fin du traitement de scoring des utilisateurs.")

def extract_user_scoring(hobbies, limit=2000):
    log_time("Début de l'exportation du scoring des utilisateurs.")
    engine = create_engine(DATABASE_URL)
    hobbies = [remove_accents_and_capitalize(hobby) for hobby in hobbies]

    query = """
    SELECT
        w."userId",
        h.name AS hobby_name,
        w.score
    FROM
        weighting w
    JOIN
        hobby h ON w."hobbyId" = h.id;
    """
    data = pd.read_sql_query(query, engine)

    # Pivoter les données pour avoir une table avec les hobbies comme colonnes
    pivot_df = data.pivot_table(index='userId', columns='hobby_name', values='score', fill_value=0)
    pivot_df = pivot_df[hobbies]
    pivot_df.reset_index(inplace=True)

    # Initialiser une liste pour stocker les résultats
    sorted_result = pd.DataFrame(columns=pivot_df.columns)

    # Trier par la priorité 1: score > 0 dans tous les hobbies
    for i in range(len(hobbies), 0, -1):
        filtered_df = pivot_df[(pivot_df[hobbies[-i:]] > 0).all(axis=1)]

        if not filtered_df.empty:
            filtered_df = filtered_df.sort_values(by=hobbies[1:], ascending=False)
            sorted_result = pd.concat([sorted_result, filtered_df])

    # Supprimer les duplications éventuelles
    sorted_result.drop_duplicates(subset='userId', keep='first', inplace=True)

    # Limiter le nombre de résultats
    sorted_result = sorted_result.head(limit)

    output_path = 'output_inst.xlsx'
    sorted_result.to_excel(output_path, index=False, engine='openpyxl')

    print(f"Fichier exporté avec succès à : {output_path}")
    log_time("Fin de l'exportation du scoring des utilisateurs.")


# Création de l'analyseur
parser = argparse.ArgumentParser(description='Exécuter des fonctions spécifiques dans le script.')
parser.add_argument('-esc', '--export_scoring', nargs='*',
                    help='Exporter le scoring des users en fonctions des hobbies choisis')
parser.add_argument('-ak', '--add_keywords', nargs='+', help='Ajouter des mots clés à un hobby')
parser.add_argument('-sc', '--scoring', help='Exécuter la fonction qui défini le poid user/hobby', action='store_true')
parser.add_argument('-l', '--limit', type=int, default=2000, help="Limite le nombre de résultats exportés")

args = parser.parse_args()

# Traitement en fonction des arguments reçus
if args.add_keywords:
    hobby = args.add_keywords[0]
    keywords = args.add_keywords[1:]
    add_keywords_to_hobby(hobby, keywords)

if args.scoring:
    let_scoring()

if args.export_scoring is not None:
    hobbies = args.export_scoring
    extract_user_scoring(hobbies, limit=args.limit)
else:
    print("Aucun hobby spécifié pour l'exportation.")
    extract_user_scoring([], limit=args.limit)

# pip install openpyxl
# pip install psycopg2
# pip install sqlalchemy
# pip install numpy
# pip install pandas
# python .\RecommandationSystem.py -sc
# python .\RecommandationSystem.py -esc manga -l 20
# python .\RecommandationSystem.py -ak manga naruto bleach
