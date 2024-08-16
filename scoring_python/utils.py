import time
import functools
from datetime import datetime
import difflib


def log_time(message):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def log_execution_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        log_time(f"Function '{func.__name__}' executed in {execution_time:.4f} seconds")
        return result

    return wrapper

def log_info_df(df, name_df):
    rows, columns = df.shape
    memory_usage = df.memory_usage(deep=True).sum()
    size = df.size
    log_time(f"{name_df} =>  rows : {rows}, columns : {columns}, size : {size}, memory_usage : {memory_usage}")

def count_similar_strings(text, string, threshold=0.8):
    text_words = text.lower().split()
    string = string.lower()
    count = 0
    for word in text_words:
        similarity = difflib.SequenceMatcher(None, word, string).ratio()
        if similarity >= threshold:
            count += 1
    return count