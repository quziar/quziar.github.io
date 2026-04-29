import psycopg2
from psycopg2.extras import RealDictCursor

PG_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres",
    "password": "93pnh75vtyw498tby4;5yt9q35bwn0"
}

class DatabaseConnection:
    def __init__(self, config):
        self.config = config
        self.conn = None

    def get_connection(self):
        if self.conn is None:
            self.conn = psycopg2.connect(**self.config)
        return self.conn

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    def get_cursor(self, dict_cursor=False):
        conn = self.get_connection()
        if dict_cursor:
            return conn.cursor(cursor_factory=RealDictCursor)
        return conn.cursor()

    def execute(self, query, params=None, dict_cursor=False):
        conn = self.get_connection()
        cursor = self.get_cursor(dict_cursor=dict_cursor)
        cursor.execute(query, params or ())
        conn.commit()
        return cursor

    def fetchone(self, query, params=None, dict_cursor=False):
        cursor = self.get_cursor(dict_cursor=dict_cursor)
        cursor.execute(query, params or ())
        result = cursor.fetchone()
        cursor.close()
        return result

    def fetchall(self, query, params=None, dict_cursor=False):
        cursor = self.get_cursor(dict_cursor=dict_cursor)
        cursor.execute(query, params or ())
        result = cursor.fetchall()
        cursor.close()
        return result

    def __enter__(self):
        if self.conn is None:
            self.conn = psycopg2.connect(**self.config)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is None:
                self.conn.commit()
            else:
                self.conn.rollback()
            self.conn.close()
            self.conn = None

    def create_all_tables(self):
        with self as db:
            cursor = db.get_cursor()

            cursor.execute("""
               CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                exam_type TEXT DEFAULT '',
                subject TEXT NOT NULL,
                year INTEGER NOT NULL,
                category TEXT NOT NULL,
                question_text TEXT NOT NULL,
                option_a TEXT,
                option_b TEXT,
                option_c TEXT,
                option_d TEXT,
                correct_answer TEXT,
                public_private TEXT
            )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chapter (
                    id SERIAL PRIMARY KEY,
                    question_number TEXT,
                    chaptername TEXT NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    identities TEXT NOT NULL,
                    class TEXT NOT NULL DEFAULT '[]',
                    login_count INTEGER NOT NULL DEFAULT 0
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS exams (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    creator_id TEXT NOT NULL,
                    questions TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    duration INTEGER NOT NULL,
                    class TEXT NOT NULL DEFAULT '[]'
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    username TEXT NOT NULL,
                    question_number TEXT NOT NULL,
                    selected_answer TEXT,
                    scores TEXT,
                    date TEXT NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS save (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    username TEXT NOT NULL,
                    question_number TEXT NOT NULL,
                    selected_answer TEXT,
                    endtime TIMESTAMP NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS question_images (
                    id SERIAL PRIMARY KEY,
                    question_id INTEGER NOT NULL,
                    image_path TEXT NOT NULL,
                    CONSTRAINT fk_question
                        FOREIGN KEY(question_id)
                        REFERENCES questions(id)
                        ON DELETE CASCADE
                )
            """)


def get_db():
    return DatabaseConnection(PG_CONFIG)

def get_question_db():
    return DatabaseConnection(PG_CONFIG)

def get_chapter_db():
    return DatabaseConnection(PG_CONFIG)

def get_history_db():
    return DatabaseConnection(PG_CONFIG)

def get_user_db():
    return DatabaseConnection(PG_CONFIG)

def get_users_db():
    return DatabaseConnection(PG_CONFIG)

def get_exam_db():
    return DatabaseConnection(PG_CONFIG)

def get_exams_db():
    return DatabaseConnection(PG_CONFIG)

def get_save_db():
    return DatabaseConnection(PG_CONFIG)

def get_saved_db():
    return DatabaseConnection(PG_CONFIG)

def get_question_image_db():
    return DatabaseConnection(PG_CONFIG)

def get_image_db():
    return DatabaseConnection(PG_CONFIG)

def get_text_db():
    return DatabaseConnection(PG_CONFIG)


try:
    db = get_db()
    db.create_all_tables()
    print("所有表格已檢查並建立（如不存在）")
except Exception as e:
    print("資料表初始化失敗:", e)