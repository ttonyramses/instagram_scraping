import re

import pandas as pd
from sqlalchemy.dialects.mssql.information_schema import columns

from utils import log_execution_time, log_info_df, log_time


class HobbyScoreCalculator:
    def __init__(self, users_df, user_followers_df, user_followings_df, user_hobby_df, hobby_df, hobby_keywords_df):
        self.users_df = users_df
        self.user_followers_df = user_followers_df
        self.user_followings_df = user_followings_df
        self.user_hobby_df = user_hobby_df
        self.hobby_df=hobby_df
        self.hobby_keywords_df = hobby_keywords_df

    @log_execution_time
    def calculate_occurrences(self):
        followers_hobby_df = pd.merge(self.user_followers_df, self.user_hobby_df, on='user_id', how='inner')
        hobby_occurrences = followers_hobby_df.groupby(['follower_id', 'hobby_id']).size().reset_index(
            name='occurrences')
        hobby_occurrences = hobby_occurrences.rename(columns={'follower_id': 'user_id'})
        log_info_df(hobby_occurrences, 'hobby_occurrences')
        return hobby_occurrences

    @log_execution_time
    def calculate_hobby_in_bio(self):
        # Créer une copie de users_df pour éviter de modifier l'original
        hobby_df = self.hobby_df[['id']].rename(columns={'id':'hobby_id'})
        users_df = self.users_df[['id', 'biography']].rename(columns={'id': 'user_id'}).merge(hobby_df, how='cross')


        # Remplacer les NaN dans 'biography' par des chaînes vides pour éviter les erreurs
        users_df['biography'] = users_df['biography'].fillna("")

        # Appliquer re.escape sur la colonne 'keyword' de hobby_keywords_df
        self.hobby_keywords_df['escaped_keyword'] = self.hobby_keywords_df['keyword'].apply(re.escape)

        # Initialiser un DataFrame vide pour les résultats
        result_df = pd.DataFrame()

        # Calculer le nombre d'occurrences de chaque mot-clé dans chaque biographie
        log_time("start calcul hobby_in_bio with keyword ")
        users_df['hobby_in_bio'] = 0
        # Calculer les occurrences et appliquer le score pour chaque mot-clé
        for index, row in self.hobby_keywords_df.iterrows():
            regex_pattern = fr'\b{row['escaped_keyword']}\b'
            score = row['score']
            # log_time(f"calcul  hobby_in_bio index : {index}, keyword : {keyword}")
            mask = users_df['hobby_id'] == row['hobby_id']
            # Utiliser str.count pour compter les occurrences du mot-clé dans chaque biographie
            users_df.loc[mask, 'hobby_in_bio'] += users_df.loc[mask, 'biography'].str.lower().str.count(regex_pattern, flags=re.IGNORECASE) * score

            # users_df['hobby_in_bio'] += users_df['biography'].apply(lambda x: count_similar_strings(x, keyword)) * score ##Excessivement lent
        # Filtrer les lignes avec hobby_in_bio > 0 pour optimiser
        hobby_in_bio_df = users_df[users_df['hobby_in_bio'] > 0]


        #hobby_in_bio_df = users_df.merge(self.user_hobby_df, left_on='id',right_on='user_id')

        # Agréger les résultats pour chaque utilisateur et hobby
        #hobby_in_bio_df_sum = hobby_in_bio_df.groupby(['user_id', 'hobby_id'])['hobby_in_bio'].sum().reset_index()

        log_info_df(hobby_in_bio_df, 'hobby_in_bio_df')

        return hobby_in_bio_df

    @log_execution_time
    def calculate_following_occurrences(self, occurrences_df):
        following_occurrences_df = pd.merge(self.user_followings_df, occurrences_df, on='user_id', how='inner')
        #following_occurrences_df = following_occurrences_df.rename(columns={'user_id_y': 'user_id'})
        following_count_df = following_occurrences_df[following_occurrences_df['occurrences'] > 0].groupby(
            ['user_id', 'hobby_id']).size().reset_index(name='following_occurrences')
        log_info_df(following_count_df, 'following_count_df')
        return following_count_df
