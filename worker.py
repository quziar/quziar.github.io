import time
import subprocess

def sync_databases_to_github():
    while True:
        print("同步資料庫到 GitHub...")
        subprocess.run(["bash", "sync_db_to_github.sh"], check=True)
        time.sleep(60)  # 每分鐘執行一次同步任務

if __name__ == "__main__":
    sync_databases_to_github()
