from sqlalchemy import create_engine
import pandas as pd


class DatabaseConnector:
    def __init__(self, database_url):
        self.engine = create_engine(database_url)

    def load_table(self, table_name):
        return pd.read_sql_table(table_name, self.engine)
