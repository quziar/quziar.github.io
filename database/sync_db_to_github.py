import os
import shutil
import stat
import subprocess
from datetime import datetime

def remove_readonly(func, path, _):
    """在 Windows 上移除唯讀限制，以允許刪除"""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def clean_tmp_dir(path):
    """刪除暫存資料夾"""
    try:
        shutil.rmtree(path, onerror=remove_readonly)
        print(f"🧹 已清除暫存資料夾：{path}")
    except Exception as e:
        print(f"⚠️ 無法刪除暫存資料夾：{e}")

def check_db_exists(db_path, db_name):
    """檢查單一資料庫是否存在"""
    if not os.path.isfile(db_path):
        print(f"❌ 找不到資料庫 {db_name}，請檢查 {db_name}_PATH")
        return False
    return True

def sync_db_to_github():

    # 變數設定
    DB1 = os.getenv("DB1_PATH")
    DB2 = os.getenv("DB2_PATH")
    DB3 = os.getenv("DB3_PATH")
    DB4 = os.getenv("DB4_PATH")
    GITHUB_REPO = os.getenv("GITHUB_REPO")
    GITHUB_USER = os.getenv("GITHUB_USER")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    BRANCH = os.getenv("GITHUB_BRANCH", "main")
    TMP_DIR = "/tmp/sqlite_backup"
    REPO_DIR = os.path.join(TMP_DIR, "repo")

    # 檢查每個資料庫是否存在
    db_check_pass = True
    if not check_db_exists(DB1, "DB1"):
        db_check_pass = False
    if not check_db_exists(DB2, "DB2"):
        db_check_pass = False
    if not check_db_exists(DB3, "DB3"):
        db_check_pass = False
    if not check_db_exists(DB4, "DB4"):
        db_check_pass = False

    if not db_check_pass:
        return  # 如果有任何資料庫不存在，終止操作

    # 建立暫存目錄
    os.makedirs(TMP_DIR, exist_ok=True)
    shutil.copy(DB1, os.path.join(TMP_DIR, "question_bank.db"))
    shutil.copy(DB2, os.path.join(TMP_DIR, "user_account.db"))
    shutil.copy(DB3, os.path.join(TMP_DIR, "text.db"))
    shutil.copy(DB4, os.path.join(TMP_DIR, "history.db"))

    # 設定 Git 身份
    subprocess.run(["git", "config", "--global", "user.name", GITHUB_USER])
    subprocess.run(["git", "config", "--global", "user.email", "NKiinimy@gmail.com"])

    # 清除已存在的 repo 資料夾
    if os.path.exists(REPO_DIR):
        clean_tmp_dir(REPO_DIR)

    # 儲存當前工作目錄
    original_cwd = os.getcwd()

    # Clone GitHub 儲存庫
    os.chdir(TMP_DIR)
    repo_url = f"https://{GITHUB_USER}:{GITHUB_TOKEN}@{GITHUB_REPO}"
    subprocess.run(["git", "clone", repo_url, "repo"], check=True)
    os.chdir(REPO_DIR)

    # 更新資料庫檔案
    shutil.copy(os.path.join(TMP_DIR, "question_bank.db"), "./database/question_bank.db")
    shutil.copy(os.path.join(TMP_DIR, "user_account.db"), "./database/user_account.db")
    shutil.copy(os.path.join(TMP_DIR, "text.db"), "./database/text.db")
    shutil.copy(os.path.join(TMP_DIR, "history.db"), "./database/history.db")

    # 提交更改並推送
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if status.stdout.strip():
        subprocess.run(["git", "add", "database/question_bank.db", "database/user_account.db", "database/text.db", "database/history.db"])
        commit_msg = f"🗂️ 更新 SQLite 資料庫 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.run(["git", "commit", "-m", commit_msg])
        subprocess.run(["git", "push", "origin", BRANCH])
        print("✅ 資料庫更新完成，已推送到 GitHub。")
    else:
        print("✅ 沒有發現變更，無需推送。")

    # 回到原始目錄再刪除暫存資料夾，避免 Windows 鎖定
    os.chdir(original_cwd)
    clean_tmp_dir(TMP_DIR)
    print("✅ 資料庫已成功同步至 GitHub。")
