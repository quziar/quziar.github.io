import sqlite3
import os

# 使用相對路徑來引用資料庫文件
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'question_bank.db')    # 題庫資料庫
USER_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')  # 使用者資料庫

class DatabaseConnection:
    def __init__(self, db_path):
        self.db_path = db_path

    def __enter__(self):
        self._ensure_database_exists()
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()

    def _ensure_database_exists(self):
        # 如果資料庫不存在，則創建
        if not os.path.exists(self.db_path):
            if self.db_path == DB_PATH:
                self._create_question_db()
            elif self.db_path == USER_DB_PATH:
                self._create_user_db()

    def _create_question_db(self):
        # 創建題庫資料庫結構
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_text TEXT NOT NULL,
                    option_a TEXT,
                    option_b TEXT,
                    option_c TEXT,
                    option_d TEXT,
                    correct_answer TEXT
                )
            ''')
            conn.commit()

    def _create_user_db(self):
        # 創建使用者資料庫結構
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            ''')
            conn.commit()


def get_question_db():
    return DatabaseConnection(DB_PATH)

def get_user_db():
    return DatabaseConnection(USER_DB_PATH)
