import pandas as pd

from sqlalchemy import Table
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database_connector import DatabaseConnector
from hobby_score_calculator import HobbyScoreCalculator
from utils import log_time, log_info_df, log_execution_time
from weighting_updater import WeightingUpdater


class InstagramHobbyAnalyzer:
    def __init__(self, database_url):
        self.db_connector = DatabaseConnector(database_url)

    @log_execution_time
    def update_scoring(self):
        log_time("Starting Instagram Hobby Analyzer")

        # Charger les tables
        log_time("Loading tables from database")
        users_df = self.db_connector.load_table('user')
        user_followers_df = self.db_connector.load_table('user_followers')
        user_followings_df = self.db_connector.load_table('user_followings')
        user_hobby_df = self.db_connector.load_table('user_hobby')
        hobby_df = self.db_connector.load_table('hobby')
        hobby_keywords_df = self.db_connector.load_table('hobby_keywords')
        weighting_df = self.db_connector.load_table('weighting')

        #users_df = users_df[users_df['id'].str.startswith('jeunesse_et')]
        log_info_df(users_df, 'users_df')
        log_info_df(user_followers_df, 'user_followers_df')
        log_info_df(user_followings_df, 'user_followings_df')
        log_info_df(user_hobby_df, 'user_hobby_df')
        log_info_df(hobby_keywords_df, 'hobby_keywords_df')
        log_info_df(weighting_df, 'weighting_df')

        # Calculer les scores
        log_time("Calculating scores")
        calculator = HobbyScoreCalculator(users_df, user_followers_df, user_followings_df, user_hobby_df,hobby_df,
                                          hobby_keywords_df)

        occurrences_df = calculator.calculate_occurrences()
        hobby_in_bio_df = calculator.calculate_hobby_in_bio()
        following_occurrences_df = calculator.calculate_following_occurrences(occurrences_df)

        # Mettre à jour les poids
        log_time("Updating weights in the database")
        updater = WeightingUpdater(weighting_df)
        updater.update_occurrences(occurrences_df)
        updater.update_hobby_in_bio(hobby_in_bio_df)
        updater.update_following_occurrences(following_occurrences_df)
        updater.calculate_final_score()

        # Sauvegarder les résultats
        updater.save_to_database(self.db_connector.engine)
        log_time("Instagram Hobby Analyzer finished")

    @log_execution_time
    def export_top_users_by_hobbies(self, hobbies, top_n=2000):
        log_time("Starting extraction user")
        # Charger la table weighting et hobby
        weighting_df = self.db_connector.load_table('weighting')
        hobby_df = self.db_connector.load_table('hobby')

        # Assigner des poids décroissants en fonction de l'ordre des hobbies
        hobby_weights = {hobby: 10 ** (len(hobbies) - i -1) for i, hobby in enumerate(hobbies)}

        # Filtrer les hobbies et appliquer les poids
        weighted_scores = []
        for hobby, weight in hobby_weights.items():
            hobby_id = hobby_df[hobby_df['name'] == hobby]['id'].values[0]
            hobby_weighting = weighting_df[weighting_df['hobbyId'] == hobby_id].copy()
            hobby_weighting['hobby_name'] = hobby
            hobby_weighting['initial_score'] = hobby_weighting['score']
            hobby_weighting['weighted_score'] = hobby_weighting['score'] * weight
            hobby_weighting['hobby_weight'] = weight  # Ajout du poids du hobby
            weighted_scores.append(hobby_weighting)

        # Combiner les scores pour les différents hobbies
        weighted_scores_df = pd.concat(weighted_scores)

        # Pivoter les données pour avoir une table avec les hobbies comme colonnes
        pivot_df = weighted_scores_df.pivot_table(index='userId', columns='hobby_name',
                                                  values=['weighted_score', 'hobby_weight'], fill_value=0)
        pivot_df.columns = [f'{col[0]}_{col[1]}' for col in pivot_df.columns]  # Aplatir les colonnes multi-index
        pivot_df.reset_index(inplace=True)

        # Liste des colonnes weighted_score
        weighted_score_columns = [f'weighted_score_{hobby}' for hobby in hobbies]

        # Calculer le nombre de hobbies par utilisateur où weighted_score > 0
        pivot_df['hobbies_count'] = (pivot_df[weighted_score_columns] > 0).sum(axis=1)

        # Calculer la somme des poids des hobbies si weighted_score > 0
        pivot_df['weighted_hobbies_sum'] = pivot_df.apply(
            lambda row: sum(row[f'hobby_weight_{hobby}'] for hobby in hobbies if row[f'weighted_score_{hobby}'] > 0) * (10**(row['hobbies_count']-1)),
            axis=1
        )

        # Calculer un bonus proportionnel au nombre de hobbies et à leurs poids
        pivot_df['bonus'] = pivot_df['weighted_hobbies_sum'].apply(lambda x: x if x > 0 else 0)

        # Grouper par utilisateur et sommer les scores pondérés
        user_scores = weighted_scores_df.groupby('userId').agg({
            'initial_score': 'sum',
            'weighted_score': 'sum'
        }).reset_index()

        # Ajouter le bonus pour les utilisateurs
        user_scores = pd.merge(user_scores, pivot_df[['userId', 'bonus']], on='userId', how='left')
        user_scores['weighted_score'] += user_scores['bonus']

        # Filtrer les utilisateurs avec un weighted_score > 0
        user_scores = user_scores[user_scores['weighted_score'] > 0]

        # Trier par score pondéré décroissant et sélectionner les top N
        top_users_weighted_score = user_scores.sort_values(by='weighted_score', ascending=False).head(top_n)

        # Ajouter les scores détaillés pour chaque hobby
        top_users_details = pd.merge(top_users_weighted_score, pivot_df, on='userId', how='left')

        # Afficher les colonnes nécessaires
        fields = ['userId'] + [f'weighted_score_{hobby}' for hobby in hobbies] + ['bonus_x', 'initial_score', 'weighted_score']
        top_users_details = top_users_details[fields]

        # Extraction dans le fichier Excel
        output_path = 'output_inst.xlsx'
        top_users_details.to_excel(output_path, index=False, engine='openpyxl')
        log_time("Ending extraction")

    @log_execution_time
    def add_or_update_keywords(self, hobby_name, keywords):
        log_time("Starting adding keywords")

        try:
            # Connexion à la base de données
            with self.db_connector.engine.connect() as connection:
                # Charger la table hobby et hobby_keywords via SQLAlchemy
                hobby_table = Table('hobby', self.db_connector.metadata, autoload_with=self.db_connector.engine)
                hobby_keywords_table = Table('hobby_keywords', self.db_connector.metadata, autoload_with=self.db_connector.engine)

                # Récupérer l'ID du hobby
                select_query = hobby_table.select().where(hobby_table.c.name.ilike(hobby_name))
                result_hobby_id = connection.execute(select_query).fetchone()

                if result_hobby_id is None:
                    log_time(f"Hobby '{hobby_name}' n'existe pas dans la base de données.")
                    return

                hobby_id = result_hobby_id.id

                # Préparer les valeurs pour l'insertion en batch
                values = [{'hobby_id': hobby_id, 'keyword': keyword, 'score': score} for keyword, score in keywords.items()]

                # Requête pour insérer ou mettre à jour en mode batch
                insert_stmt = pg_insert(hobby_keywords_table).values(values)

                # Définir l'action en cas de conflit (ON CONFLICT)
                upsert_stmt = insert_stmt.on_conflict_do_update(
                    index_elements=['hobby_id', 'keyword'],
                    set_=dict(score=insert_stmt.excluded.score)
                )

                # Exécuter la requête
                result = connection.execute(upsert_stmt)
                connection.commit()
                log_time(f"keyword for hobby '{hobby_name}' update executed: {result.rowcount}, rows affected")

        except Exception as e:
            log_time(f"Erreur lors de l'insertion/mise à jour des mots-clés: {e}")
