import sqlite3
import bcrypt
from database import USER_DB_PATH, get_user_db

# 驗證密碼
def verify_password(stored_hash: str, input_password: str) -> bool:
    return bcrypt.checkpw(input_password.encode(), stored_hash.encode())
    
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

