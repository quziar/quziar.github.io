import sqlite3
import os

DB_PATH = r"C:\question_bank_system\database\question_bank.db"

class DatabaseConnection:
    def __enter__(self):
        if not os.path.exists(DB_PATH):
            raise Exception(f"錯誤：資料庫不存在：{DB_PATH}")
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row  # 讓查詢結果以字典形式返回
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()

def get_db_connection():
    return DatabaseConnection()
