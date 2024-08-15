import numpy as np
from sqlalchemy import text

from utils import log_execution_time, log_info_df, log_time
import pandas as pd


class WeightingUpdater:
    def __init__(self, weighting_df):
        self.weighting_df = weighting_df

    @log_execution_time
    def update_occurrences(self, occurrences_df):
        log_info_df(occurrences_df, 'occurrences_df')

        # Utiliser une fusion pour mettre à jour la colonne occurrences
        self.weighting_df = occurrences_df[['user_id', 'hobby_id', 'occurrences']].merge(self.weighting_df,
            left_on=['user_id', 'hobby_id'],
            right_on=['userId', 'hobbyId'],
            how = 'outer')

        # Mettre à jour uniquement les valeurs existantes, sans écraser les valeurs existantes qui n'ont pas de correspondance
        self.weighting_df['occurrences'] = self.weighting_df['occurrences_x'].fillna(0)
        self.weighting_df['userId'] = self.weighting_df['user_id'].fillna(self.weighting_df['userId'] )
        self.weighting_df['hobbyId'] = self.weighting_df['hobby_id'].fillna(self.weighting_df['hobbyId'])
        columns_to_drop = ['occurrences_x', 'occurrences_y', 'user_id', 'hobby_id', 'id']
        existing_columns = [col for col in columns_to_drop if col in self.weighting_df.columns]
        self.weighting_df.drop(columns=existing_columns, inplace=True)

        # Supprimer les colonnes intermédiaires créées par la fusion

    @log_execution_time
    def update_hobby_in_bio(self, hobby_in_bio_df):
        log_info_df(hobby_in_bio_df, 'hobby_in_bio_df')

        # Utiliser une fusion pour mettre à jour la colonne hobby_in_bio
        self.weighting_df = hobby_in_bio_df[['user_id', 'hobby_id', 'hobby_in_bio']].merge(self.weighting_df,
            left_on=['user_id', 'hobby_id'],
            right_on=['userId', 'hobbyId'],
            how = 'outer'
        )

        # Mettre à jour uniquement les valeurs existantes
        self.weighting_df['hobby_in_bio'] = self.weighting_df['hobby_in_bio_x'].fillna(0)
        self.weighting_df['userId'] = self.weighting_df['user_id'].fillna(self.weighting_df['userId'] )
        self.weighting_df['hobbyId'] = self.weighting_df['hobby_id'].fillna(self.weighting_df['hobbyId'])

        # Supprimer les colonnes intermédiaires
        columns_to_drop = ['hobby_in_bio_x', 'hobby_in_bio_y', 'user_id', 'hobby_id', 'id']
        existing_columns = [col for col in columns_to_drop if col in self.weighting_df.columns]
        self.weighting_df.drop(columns=existing_columns, inplace=True)

    @log_execution_time
    def update_following_occurrences(self, following_occurrences_df):
        log_info_df(following_occurrences_df, 'following_occurrences_df')

        # Utiliser une fusion pour mettre à jour la colonne following_occurrences
        self.weighting_df = following_occurrences_df[['user_id', 'hobby_id', 'following_occurrences']].merge(self.weighting_df,
            left_on=['user_id', 'hobby_id'],
            right_on=['userId', 'hobbyId'],
            how = 'outer'
        )

        # Mettre à jour uniquement les valeurs existantes
        self.weighting_df['following_occurrences'] = self.weighting_df['following_occurrences_x'].fillna(0)
        self.weighting_df['userId'] = self.weighting_df['user_id'].fillna(self.weighting_df['userId'] )
        self.weighting_df['hobbyId'] = self.weighting_df['hobby_id'].fillna(self.weighting_df['hobbyId'])

        # Supprimer les colonnes intermédiaires
        columns_to_drop = ['following_occurrences_x', 'following_occurrences_y', 'user_id', 'hobby_id', 'id']
        existing_columns = [col for col in columns_to_drop if col in self.weighting_df.columns]
        self.weighting_df.drop(columns=existing_columns, inplace=True)

    @log_execution_time
    def calculate_final_score(self):
        #convertir les types pour se rassurer qu'il sont dans le bon format
        self.weighting_df['occurrences'] = self.weighting_df['occurrences'].replace([np.inf, -np.inf], np.nan).fillna(0).astype('int32')  # ou 'int64' pour BIGINT
        self.weighting_df['following_occurrences'] = self.weighting_df['following_occurrences'].replace([np.inf, -np.inf], np.nan).fillna(0).astype('int32')  # ou 'int64' pour BIGINT
        self.weighting_df['hobby_in_bio'] = self.weighting_df['hobby_in_bio'].replace([np.inf, -np.inf], np.nan).fillna(0).astype('int32')  # ou 'int64' pour BIGINT

        # Calculer le score final avec une opération vectorisée
        self.weighting_df['score'] = (
                self.weighting_df['occurrences'] * 5 +
                self.weighting_df['hobby_in_bio'] +
                self.weighting_df['following_occurrences']
        )
        self.weighting_df['score'] = self.weighting_df['score'].fillna(0).astype('int64')  # ou 'int64' pour BIGINT
        log_info_df(self.weighting_df, 'self.weighting_df')

    @log_execution_time
    def save_to_database(self, engine):
        # Transformer le DataFrame en une liste de tuples
        data_tuples = list(self.weighting_df.itertuples(index=False, name='weighting'))

        # Requête SQL pour mise à jour en bloc
        insert_query = """
            INSERT INTO weighting ("hobbyId", "userId", score, occurrences, following_occurrences, hobby_in_bio)
            VALUES (:hobbyId, :userId, :score, :occurrences, :following_occurrences, :hobby_in_bio)
            ON CONFLICT ("userId", "hobbyId") 
            DO UPDATE 
            SET score=EXCLUDED.score, occurrences=EXCLUDED.occurrences, following_occurrences=EXCLUDED.following_occurrences, hobby_in_bio=EXCLUDED.hobby_in_bio
        """

        # Exécution en mode batch
        with engine.connect() as conn:
            log_time("Starting the batch update...")
            with conn.begin():
                result = conn.execute(
                    text(insert_query),
                    [{"userId": row.userId, "hobbyId": row.hobbyId, "score":row.score, "occurrences": row.occurrences, "following_occurrences":row.following_occurrences, "hobby_in_bio": row.hobby_in_bio } for row in data_tuples]
                )
                log_time(f"Batch update executed: {result.rowcount}, rows affected")

