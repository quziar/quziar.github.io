import sqlite3
import os

# 使用相對路徑來引用資料庫文件
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'question_bank.db')

class DatabaseConnection:
    def __enter__(self):
        # 檢查資料庫是否存在
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
