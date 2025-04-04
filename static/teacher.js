// 取得當前使用者 名稱
async function getCurrentUser() {
    const response = await fetch('/api/session/get_user/');
    if (response.ok) {
        const data = await response.json();
        return(data.currentUserID);
    } else {
        console.log('未登入');
    }
}

document.addEventListener("DOMContentLoaded", async function() { 
    // 取得當前使用者
    let currentUser = await getCurrentUser();

    if (currentUser) {
        // 顯示歡迎訊息
        alert(`🎉 歡迎回來 ${currentUser}！`);
    } else {
        // 當使用者未登入時，觸發特定訊息
        showHackerAlert();
    }
});

// ===================== 查看所有題目 =====================

// 當點擊查看所有題目按鈕時，發送 GET 請求
document.getElementById('viewAllBtn').addEventListener('click', function () {
    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在載入題目...';

    fetch('/api/questions/view_all_questions/') // 注意：這裡需要與 FastAPI 路由一致
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = ''; // 清空現有題目

            if (data.questions && data.questions.length === 0) {
                questionList.innerHTML = '<p>目前沒有題目</p>';
            } else {
                // 顯示從後端獲取的題目
                data.questions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    // 添加勾選框
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('question-checkbox');
                    checkbox.value = question.id;

                    // 顯示科目、年度、類別
                    div.innerHTML = `
                        <strong>科目：</strong> ${question.subject || '無科目'}<br>
                        <strong>年度：</strong> ${question.year || '無年度'}<br>
                        <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                    `;

                    // 將勾選框插入到題目內容前
                    div.prepend(checkbox);

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
            document.getElementById('response').textContent = ''; // 清除載入提示
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

// ===================== 刪除特定題目 =====================
// 當點擊刪除題目按鈕時，發送 POST 請求
document.getElementById('deleteBtn').addEventListener('click', function() {
    const questionId = document.getElementById('questionId').value;

    // 檢查ID是否為數字
    if (!questionId || isNaN(questionId)) {
        document.getElementById('response').textContent = '請輸入有效的數字ID！';
        return;
    }

    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在刪除題目...';

    fetch('/api/questions/delete-question/', {  // 這裡使用 POST 請求並提供 question_id
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question_id: parseInt(questionId) })  // 轉換ID為數字
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail);
                });
            }
            return response.json();
        })
        .then(data => {
            questionList.innerHTML = '';
            document.getElementById('response').textContent = data.message;  // 顯示成功訊息
        })
        .catch(error => {
            document.getElementById('response').textContent = '刪除題目時發生錯誤，請稍後再試。';
            console.error('Error:', error);
        });
});

// ===================== 顯示特定題目 =====================
document.getElementById('viewQuestionBtn').addEventListener('click', function() {
    const questionId = document.getElementById('questionId').value;

    // 檢查 ID 是否為數字
    if (!questionId || isNaN(questionId)) {
        document.getElementById('response').textContent = '請輸入有效的數字ID！';
        return;
    }

    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在載入題目...';

    fetch('/api/questions/view_all_questions/')  // 從所有題目中過濾
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';  // 清空現有題目

            // 從所有題目中找到符合的 question_id
            const question = data.questions.find(q => q.id === parseInt(questionId));

            if (!question) {
                questionList.innerHTML = '<p>找不到該題目，請確認 ID 是否正確。</p>';
            } else {
                // 顯示符合條件的題目
                const div = document.createElement('div');
                div.classList.add('question-item');

                div.innerHTML = `
                    <strong>科目：</strong> ${question.subject || '無科目'}<br>
                    <strong>年度：</strong> ${question.year || '無年度'}<br>
                    <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                    <strong>ID:</strong> ${question.id}<br>
                    <strong>問題：</strong> ${question.question_text || '無題目'}<br>
                    <div class="answer-options">
                        <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                        <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                        <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                        <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                    </div>
                    <br><strong>解答：</strong> ${question.correct_answer || '無解答'}
                `;

                questionList.appendChild(div);
            }

            document.getElementById('response').textContent = '';  // 清除載入提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
            console.error('Error:', error);
        });
});

// ===================== 比對相似題目 =====================
document.getElementById('compareQuestionsBtn').addEventListener('click', function() {
    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在比對題目...';
    fetch('/api/questions/view_all_questions/')  // 取得所有題目
        .then(response => response.json())
        .then(data => {
            const questions = data.questions;
            const similarQuestions = new Set();

            function normalizeText(text) {
                return text ? text.replace(/\s+/g, '').toLowerCase().split('').sort().join('') : '';
            }

            function similarityScore(str1, str2) {
                if (!str1 || !str2) return 0;

                // 轉換為字符集合 (去除重複字元)
                const set1 = new Set(str1);
                const set2 = new Set(str2);

                // 計算交集 (相同字元數)
                const intersection = new Set([...set1].filter(char => set2.has(char)));
                
                // 計算聯集 (所有不重複的字元)
                const union = new Set([...set1, ...set2]);
                
                // 計算 Jaccard 相似度
                return intersection.size / union.size;
            }

            for (let i = 0; i < questions.length; i++) {
                for (let j = i + 1; j < questions.length; j++) {
                    const q1 = questions[i];
                    const q2 = questions[j];

                    const options1 = [
                        normalizeText(q1.option_a),
                        normalizeText(q1.option_b),
                        normalizeText(q1.option_c),
                        normalizeText(q1.option_d),
                        normalizeText(q1.correct_answer)
                    ].sort().join('|');

                    const options2 = [
                        normalizeText(q2.option_a),
                        normalizeText(q2.option_b),
                        normalizeText(q2.option_c),
                        normalizeText(q2.option_d),
                        normalizeText(q2.correct_answer)
                    ].sort().join('|');

                    if (similarityScore(options1, options2) >= 0.9) {
                        similarQuestions.add(q1);
                        similarQuestions.add(q2);
                    }
                }
            }

            const resultDiv = document.getElementById('questionList');
            resultDiv.innerHTML = '';

            if (similarQuestions.size > 0) {
                similarQuestions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    div.innerHTML = `
                        <strong>科目：</strong> ${question.subject || '無科目'}<br>
                        <strong>年度：</strong> ${question.year || '無年度'}<br>
                        <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                        <strong>ID:</strong> ${question.id}<br>
                        <strong>問題：</strong> ${question.question_text || '無題目'}<br>
                        <div class="answer-options">
                            <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                            <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                            <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                            <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                        </div>
                        <br><strong>解答：</strong> ${question.correct_answer || '無解答'}
                    `;

                    resultDiv.appendChild(div);
                });
            } else {
                resultDiv.innerHTML = '<p>未找到相似題目。</p>';
            }

            document.getElementById('response').textContent = ''; // 清除載入提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
            console.error('Error:', error);
        });
});

// ===================== 顯示根據關鍵字過濾的題目 =====================
document.getElementById('filterByCategoryBtn').addEventListener('click', function() {
    const selectedCategory = document.getElementById('categoryInput').value.trim();

    // 檢查是否有輸入關鍵字
    if (!selectedCategory) {
        document.getElementById('response').textContent = '請輸入一個關鍵字！';
        return;
    }

    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在載入題目...';

    fetch(`/api/questions/view_all_questions/`)  // 獲取所有題目
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';  // 清空現有題目

            // 篩選出符合關鍵字的題目
            const filteredQuestions = data.questions.filter(question => 
                (String(question.subject).includes(selectedCategory)) ||
                (String(question.year).includes(selectedCategory)) ||
                (String(question.category).includes(selectedCategory)) ||
                (String(question.id).includes(selectedCategory)) ||
                (String(question.question_text).includes(selectedCategory)) ||
                (String(question.option_a).includes(selectedCategory)) ||
                (String(question.option_b).includes(selectedCategory)) ||
                (String(question.option_c).includes(selectedCategory)) ||
                (String(question.option_d).includes(selectedCategory)) ||
                (String(question.correct_answer).includes(selectedCategory))
            );
            

            if (filteredQuestions.length === 0) {
                questionList.innerHTML = `<p>未找到符合關鍵字「${selectedCategory}」的題目。</p>`;
            } else {
                // 顯示符合條件的題目
                filteredQuestions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    div.innerHTML = `
                        <strong>科目：</strong> ${question.subject || '無科目'}<br>
                        <strong>年度：</strong> ${question.year || '無年度'}<br>
                        <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                        <strong>ID:</strong> ${question.id}<br>
                        <strong>問題：</strong> ${question.question_text || '無題目'}<br>
                        <div class="answer-options">
                            <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                            <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                            <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                            <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                        </div>
                        <br><strong>解答：</strong> ${question.correct_answer || '無解答'}
                    `;

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

// 清除ID
async function logout() {
    try {
        const response = await fetch('/api/session/logout/', {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data.message); // 顯示登出訊息
            return true; // 表示登出成功
        } else {
            console.error("登出失敗，伺服器回傳錯誤。");
            return false;
        }
    } catch (error) {
        console.error("登出過程中出錯：", error);
        return false;
    }
}

// 登出功能
async function logoutFunction() {
    const confirmLogout = window.confirm("確定要登出嗎？"); // 確認對話框
    if (confirmLogout) {
        const result = await logout(); // 等待登出完成
        if (result) {
            alert("已成功登出！");
            window.location.href = "/static/home.html"; // 跳轉到首頁
        } else {
            alert("登出失敗，請稍後再試！");
        }
    }
}

// 綁定事件到按鈕
document.getElementById("login-link").addEventListener("click", logoutFunction);



// ===================== 生成考卷 ===================== 
document.getElementById('copyteat').addEventListener('click', async function () {
    const button = this;
    const responseDiv = document.getElementById('response');
    responseDiv.textContent = '正在生成考卷，請稍候...';

    button.disabled = true;
    button.textContent = "生成中...";

    // 取得選中的題目 ID 列表
    const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
                                   .map(checkbox => parseInt(checkbox.value)); // 確保是整數

    if (selectedQuestions.length === 0) {
        responseDiv.textContent = '請先勾選至少一個題目！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    // 取得當前使用者 ID
    let currentUser = await getCurrentUser();

    if (!currentUser) {
        responseDiv.textContent = '請先登入再生成考卷！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    // 在發送請求之前，檢查傳送的資料
    console.log('傳送的資料:', JSON.stringify({
        creator_id: currentUser,  // 當前使用者 ID
        selectedQuestions: selectedQuestions // 確保是正確格式的列表
    }));

    try {
        const response = await fetch('/api/exam/generate-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creator_id: currentUser,  // 當前使用者 ID
                selectedQuestions: selectedQuestions // 確保是正確格式的列表
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('考卷生成成功:');
            responseDiv.textContent = `考卷生成成功！`;
        }

    } finally {
        button.disabled = false;
        button.textContent = "生成考卷";
    }
});

// ===================== 查看考卷 ===================== 
document.getElementById('viewteat').addEventListener('click', async function () {
    document.getElementById('response').textContent = '正在載入考卷列表...';

    fetch('/api/exam/view_exam/')
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = ''; // 清空現有資料

            if (data.exams && data.exams.length === 0) {
                questionList.innerHTML = '<p>目前沒有考卷。</p>';
            } else {
                // 生成考卷列表
                data.exams.forEach(exam => {
                    const div = document.createElement('div');
                    div.classList.add('text-item');
                    div.innerHTML = `
                        <strong>題目:</strong> ${exam.questions} <br>
                        <hr>
                    `;
                    questionList.appendChild(div);
                });
            }
            document.getElementById('response').textContent = ''; // 清除提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入考卷，請稍後再試。';
            console.error('Error:', error);
        });
});
