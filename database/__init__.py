import sqlite3
import os
import redis
import base64

# ------------------------- 資料庫操作 -------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'question_bank.db')    # 題庫資料庫
USER_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')  # 使用者資料庫
TEXT_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'text.db')  # 考卷資料庫
HISTORY_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'history.db')  # 歷史紀錄資料庫
IMAGE_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'image.db')  # 新增圖片資料庫
SAVE_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'save.db')  # 新增存檔資料庫

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
        elif self.db_path == IMAGE_DB_PATH:
            self._create_image_db()
        elif self.db_path == SAVE_DB_PATH:
            self._create_save_db()

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

    def _create_image_db(self):
        """創建圖片資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS question_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_id INTEGER NOT NULL,
                    image_path TEXT NOT NULL,
                    FOREIGN KEY (question_id) REFERENCES questions (id)
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
                    identities TEXT NOT NULL,
                    class TEXT NOT NULL
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
                    whetherexam INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (creator_id) REFERENCES users (username)
                )
            ''')
            conn.commit()

    def _create_history_db(self):
        """創建歷史紀錄資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    username TEXT NOT NULL,
                    question_number TEXT NOT NULL,
                    selected_answer TEXT,
                    date TEXT NOT NULL
                )
            ''')
            conn.commit()

    def _create_save_db(self):
        """創建存檔資料庫結構"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS save (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    question_number TEXT NOT NULL,
                    selected_answer TEXT,
                    endtime TIMESTAMP NOT NULL
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

def get_image_db():
    return DatabaseConnection(IMAGE_DB_PATH)
    
def get_save_db():
    return DatabaseConnection(SAVE_DB_PATH)