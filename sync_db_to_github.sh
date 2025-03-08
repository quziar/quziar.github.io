#!/bin/bash

# 變數設定
DB1="$DB1_PATH"
DB2="$DB2_PATH"
GITHUB_REPO="$GITHUB_REPO"
BRANCH="${GITHUB_BRANCH:-main}"
TMP_DIR="/tmp/sqlite_backup"

# 檢查資料庫是否存在
if [ ! -f "$DB1" ] || [ ! -f "$DB2" ]; then
    echo "❌ 找不到資料庫，請檢查 DB1_PATH 和 DB2_PATH"
    exit 1
fi

# 建立暫存目錄
mkdir -p $TMP_DIR
cp "$DB1" "$TMP_DIR/question_bank.db"
cp "$DB2" "$TMP_DIR/user_data.db"

# 設定 Git 身份
git config --global user.name "$GITHUB_USER"
git config --global user.email "NKiinimy@gmail.com"

# Clone GitHub 儲存庫
cd $TMP_DIR
git clone "https://${GITHUB_USER}:${GITHUB_TOKEN}@${GITHUB_REPO}" repo
cd repo

# 更新資料庫檔案
cp "$TMP_DIR/question_bank.db" .
cp "$TMP_DIR/user_data.db" .

# 提交更改並推送
if [ -n "$(git status --porcelain)" ]; then
    git add question_bank.db user_data.db
    git commit -m "🗂️ 更新 SQLite 資料庫 $(date)"
    git push origin $BRANCH
    echo "✅ 資料庫更新完成，已推送到 GitHub。"
else
    echo "✅ 沒有發現變更，無需推送。"
fi

# 清理暫存
rm -rf $TMP_DIR
