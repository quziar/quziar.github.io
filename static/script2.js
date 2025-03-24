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

// ===================== 新增題目 =====================
document.getElementById("submitQuestion").addEventListener("click", async () => {
    // 取得表單欄位資料
    const subject = document.getElementById("subject").value;
    const year = document.getElementById("year").value;
    const category = document.getElementById("category").value;
    const questionText = document.getElementById("questionText").value;
    const optionA = document.getElementById("optionA").value;
    const optionB = document.getElementById("optionB").value;
    const optionC = document.getElementById("optionC").value;
    const optionD = document.getElementById("optionD").value;
    const correctAnswer = document.querySelector('input[name="correct_answer"]:checked')?.value;

    // 檢查是否有選擇正確答案
    if (!correctAnswer) {
        alert("請選擇正確答案！");
        return;
    }

    // 檢查必要欄位是否填寫
    if (!subject || !year || !category || !questionText || !optionA || !optionB || !optionC || !optionD) {
        alert("請完整填寫題目資料！");
        return;
    }

    // 構建要傳送的題目資料
    const questionData = {
        subject: subject,
        year: year,
        category: category,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer
    };

    // 取得公私有選項
    const publicPrivate = document.querySelector('input[name="public_private"]:checked')?.value;

    // 檢查是否有選擇公私有選項
    if (!publicPrivate) {
        alert("請選擇公有或私有！");
        return;
    }

    // 將資料傳送給後端
    const formData = new FormData();
    formData.append("question", JSON.stringify(questionData));
    formData.append("public_private", publicPrivate);

    try {
        // 發送請求
        const response = await fetch("/api/questions/import-questions/", {
            method: "POST",
            body: formData,
        });

        // 處理回應
        const result = await response.json();
        document.getElementById("addResponse").innerText = result.message;

        // 清空表單欄位
        document.getElementById("subject").value = '';
        document.getElementById("year").value = '';
        document.getElementById("category").value = '';
        document.getElementById("questionText").value = '';
        document.getElementById("optionA").value = '';
        document.getElementById("optionB").value = '';
        document.getElementById("optionC").value = '';
        document.getElementById("optionD").value = '';
    } catch (error) {
        console.error("新增題目失敗", error);
        document.getElementById("addResponse").innerText = "新增題目時發生錯誤。";
    }
});
