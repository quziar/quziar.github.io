import sqlite3
import os

# 使用相對路徑來引用資料庫文件
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'question_bank.db')
USER_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')  # 新增使用者資料庫路徑

class DatabaseConnection:
    def __enter__(self):
        # 檢查資料庫是否存在，如果不存在則創建
        self._ensure_database_exists(DB_PATH, USER_DB_PATH)
        
        self.conn = sqlite3.connect(DB_PATH)  # 用於題庫資料
        self.conn.row_factory = sqlite3.Row  # 讓查詢結果以字典形式返回
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()

    def _ensure_database_exists(self, db_path, user_db_path):
        # 確保題庫資料庫存在
        if not os.path.exists(db_path):
            self._create_database(db_path)

        # 確保使用者帳號資料庫存在
        if not os.path.exists(user_db_path):
            self._create_user_database(user_db_path)

    def _create_database(self, db_path):
        # 創建資料庫和表格
        with sqlite3.connect(db_path) as conn:
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

    def _create_user_database(self, user_db_path):
        # 創建使用者資料庫和表格
        with sqlite3.connect(user_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            ''')
            conn.commit()


def get_db_connection():
    return DatabaseConnection()
