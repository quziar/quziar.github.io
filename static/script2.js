// ===================== 查看所有題目 =====================

// 當點擊查看所有題目按鈕時，發送 GET 請求
document.getElementById('viewAllBtn').addEventListener('click', function() {
    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在載入題目...';

    fetch('/api/questions/view_all_questions/')  // 注意：這裡需要與 FastAPI 路由一致
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';  // 清空現有題目

            if (data.questions && data.questions.length === 0) {
                questionList.innerHTML = '<p>目前沒有題目</p>';
            } else {
                // 顯示從後端獲取的題目
                data.questions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    // 顯示科目、年度、類別
                    div.innerHTML = `
                        <strong>科目：</strong> ${question.subject || '無科目'}<br>
                        <strong>年度：</strong> ${question.year || '無年度'}<br>
                        <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                    `;

                    // 顯示題目的 ID 和問題內容
                    div.innerHTML += `
                        <strong>ID:</strong> ${question.id}<br>
                        <strong>問題：</strong> ${question.question_text || '無題目'}<br>
                    `;

                    // 顯示選項
                    const optionsDiv = document.createElement('div');
                    optionsDiv.classList.add('answer-options');
                    optionsDiv.innerHTML = `
                        <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                        <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                        <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                        <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                    `;
                    div.appendChild(optionsDiv);

                    // 顯示正確答案
                    div.innerHTML += `<br><strong>解答：</strong> ${question.correct_answer || '無解答'}`;

                    questionList.appendChild(div);
                });
            }
            document.getElementById('response').textContent = '';  // 清除載入提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
            console.error('Error:', error);
        });
});


// ===================== 匯入題目 =====================


document.getElementById("importBtn").addEventListener("click", () => {

    questionList.innerHTML = '';
    
    // 顯示選擇公私有的視窗
    document.getElementById("publicPrivateModal").style.display = "block";

    // 處理公私有選擇確認
    document.getElementById("confirmPublicPrivate").addEventListener("click", () => {
        document.getElementById("publicPrivateModal").style.display = "none";
        document.getElementById("excelFile").style.display = "block";
    });

    // 取消匯入
    document.getElementById("cancelModal").addEventListener("click", () => {
        document.getElementById("publicPrivateModal").style.display = "none";
    });

    // 當選擇檔案後開始上傳
    document.getElementById("excelFile").addEventListener("change", async () => {
        const fileInput = document.getElementById("excelFile");
        const file = fileInput.files[0];

        if (!file) {
            alert("請選擇 Excel 檔案！");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("public_private", document.querySelector('input[name="public_private"]:checked').value);

        try {
            const response = await fetch("/api/questions/import-questions/", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            alert(result.message);

            // 清空檔案選擇欄位
            fileInput.value = '';

            // 隱藏 excelFile 元素
            document.getElementById("excelFile").style.display = "none";
        } catch (error) {
            alert("匯入失敗，請稍後再試。錯誤：" + error);
        }
    });
});


// ===================== 清空題目 =====================

// 清空所有題目
document.getElementById("clearBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/questions/clear-all-questions/", {
            method: "POST",
        });

        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert("Error: " + error);
    }
});

// ===================== 整理重複題目 =====================

// 清理重複題目
document.getElementById("cleanDuplicatesBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/questions/clean-duplicate-questions/", {
            method: "POST",
        });

        const result = await response.json();
        questionList.innerHTML = '';
        alert(result.message);
    } catch (error) {
        alert("Error: " + error);
    }
});

// ===================== 查看所有使用者 =====================

// 查看所有使用者
document.getElementById('viewUsersBtn').addEventListener('click', function() {
    document.getElementById('response').textContent = '正在載入使用者列表...';

    fetch('/api/save_users/view_all_users/')
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = ''; // 清空現有資料

            if (data.users && data.users.length === 0) {
                questionList.innerHTML = '<p>目前沒有使用者。</p>';
            } else {
                // 生成使用者列表
                data.users.forEach(user => {
                    const div = document.createElement('div');
                    div.classList.add('user-item');
                    div.innerHTML = `
                        <strong>ID:</strong> ${user.id} <br>
                        <strong>帳號:</strong> ${user.username} <br>
                        <hr>
                    `;
                    questionList.appendChild(div);
                });
            }
            document.getElementById('response').textContent = ''; // 清除提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入使用者，請稍後再試。';
            console.error('Error:', error);
        });
});

// ===================== 下載題庫Excel =====================
// 下載 Excel 按鈕
document.getElementById('exportExcelBtn').addEventListener('click', async function() {
    try {
        // 呼叫 API 取得 Excel 檔案
        const response = await fetch('/api/questions/export');

        // 確保請求成功
        if (!response.ok) {
            throw new Error('無法下載題庫，請稍後再試。');
        }

        // 轉換為 Blob 對象 (二進制數據)
        const blob = await response.blob();

        // 建立下載連結
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions_export.xlsx'; // 下載的檔案名稱
        document.body.appendChild(a);
        a.click();

        // 清理臨時 URL
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('下載 Excel 失敗:', error);
        alert('下載 Excel 失敗，請稍後再試。');
    }
});

