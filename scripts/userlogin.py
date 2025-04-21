import sqlite3
import bcrypt
from database import USER_DB_PATH, get_user_db

# 驗證密碼
def verify_password(stored_hash: str, input_password: str) -> bool:
    return bcrypt.checkpw(input_password.encode(), stored_hash.encode())

# 驗證使用者密碼
def verify_user_password(db_path, username, input_password):
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT password FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()

            if row:
                stored_hashed_password = row[0]

                if verify_password(stored_hashed_password, input_password):
                    return True
                else:
                    return False
            else:
                return False

    except Exception as e:
        print(f"❌ 登入過程中發生錯誤：{str(e)}")
        return False

def userlogin(username, input_password):
    try:
        with sqlite3.connect(USER_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT username, password, identities FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()

            if row:
                stored_username, stored_hashed_password, identities = row

                if verify_password(stored_hashed_password, input_password):
                    return {
                        "username": stored_username,
                        "identities": identities
                    }
                else:
                    return None
            else:
                return None

    except sqlite3.DatabaseError as db_error:
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        raise Exception(f"登入過程中出錯，請稍後再試。錯誤詳情: {str(e)}")

