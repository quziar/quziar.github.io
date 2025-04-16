import sqlite3
import os

# 使用相對路徑來引用資料庫文件
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'question_bank.db')    # 題庫資料庫
USER_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')  # 使用者資料庫
TEXT_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'text.db')  # 考卷資料庫
HISTORY_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'history.db')  # 歷史紀錄資料庫

class DatabaseConnection:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def get_connection(self):
        """手動獲取資料庫連線"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
        return self.conn

    def close(self):
        """關閉資料庫連線"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def __enter__(self):
        """使用 with 語句時自動管理資料庫連線"""
        self._ensure_database_exists()
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
        return self.conn  # 返回連線物件

    def __exit__(self, exc_type, exc_val, exc_tb):
        """退出時關閉連線"""
        if self.conn:
            self.conn.close()

    def _ensure_database_exists(self):
        """如果資料庫不存在，則創建"""
        if not os.path.exists(self.db_path):
            self._create_database()

    def _create_database(self):
        """根據資料庫路徑選擇對應的創建邏輯"""
        if self.db_path == DB_PATH:
            self._create_question_db()
        elif self.db_path == USER_DB_PATH:
            self._create_user_db()
        elif self.db_path == TEXT_DB_PATH:
            self._create_text_db()
        elif self.db_path == HISTORY_DB_PATH:
            self._create_history_db()

    def _create_question_db(self):
        """創建題庫資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            ''')
            conn.commit()

    def _create_user_db(self):
        """創建使用者資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    identities TEXT NOT NULL
                )
            ''')
            conn.commit()

    def _create_text_db(self):
        """創建考卷資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    creator_id TEXT NOT NULL,
                    questions TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    duration INTEGER NOT NULL,
                    FOREIGN KEY (creator_id) REFERENCES users (username)
                )
            ''')
            conn.commit()


    
    def _create_history_db(self):
        """創建歷史紀錄資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # 創建 history 表格
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    score REAL NOT NULL,
                    incorrectCount INTEGER NOT NULL,
                    date TEXT NOT NULL
                )
            ''')

            # 創建 history_details 表格
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS history_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    history_id INTEGER,
                    question_number INTEGER NOT NULL,
                    selected_answer TEXT,
                    correct_answer TEXT,
                    is_correct INTEGER,
                    explanation TEXT,
                    FOREIGN KEY (history_id) REFERENCES history (id)
                )
            ''')

            conn.commit()

    def get_cursor(self):
        """取得一個資料庫游標"""
        if not self.conn:
            self.conn = sqlite3.connect(self.db_path)
        return self.conn.cursor()

def get_question_db():
    return DatabaseConnection(DB_PATH)

def get_user_db():
    return DatabaseConnection(USER_DB_PATH)

def get_text_db():
    return DatabaseConnection(TEXT_DB_PATH)

def get_history_db():
    return DatabaseConnection(HISTORY_DB_PATH)