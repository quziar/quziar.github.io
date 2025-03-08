#!/bin/bash

# 設定資料庫檔案和 GitHub 儲存庫位置
DB_FILE="/path/to/your/database.db"
GITHUB_REPO="git@github.com:your-username/sqlite-database.git"
BRANCH="main"  # 或你使用的分支名稱

# 設定 Git 使用者名稱與電子郵件
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# 切換到儲存庫目錄
cd /path/to/your/repository

# 拉取最新的資料庫文件
git pull origin $BRANCH

# 複製資料庫檔案到儲存庫資料夾
cp $DB_FILE .

# 提交並推送更改
git add database.db
git commit -m "Update SQLite database"
git push origin $BRANCH
