let questions = [];

async function fetchQuestions() {
    try {
        let response = await fetch("/api/questions/read_questions/");
        let data = await response.json();
        questions = data.questions;
        console.log("載入的題目：", questions);
    } catch (error) {
        console.error("獲取題庫資料時出錯:", error);
    }
}

document.addEventListener("DOMContentLoaded", fetchQuestions);

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

// ---------- Modal 元素 ----------
const modal = document.createElement("div");
modal.id = "editModal";
modal.classList.add("modal");

const modalContent = document.createElement("div");
modalContent.classList.add("modal-content");
modal.appendChild(modalContent);

const closeModal = document.createElement("span");
closeModal.id = "closeModal";
closeModal.textContent = "×";
modalContent.appendChild(closeModal);

const editFrame = document.createElement("iframe");
editFrame.id = "editFrame";
modalContent.appendChild(editFrame);

document.body.appendChild(modal);

// 關閉 Modal
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

let currentPage = 1;
const itemsPerPage = 10;
let allQuestions = [];

document.getElementById('viewAllBtn').addEventListener('click', function () {
    const questionList = document.getElementById('questionList');
    const responseText = document.getElementById('response');

    if (questionList.style.display === 'none' || questionList.style.display === '') {
        responseText.textContent = '正在載入題目...';
        questionList.style.display = 'block';

        fetch('/api/questions/view_all_questions/')
            .then(response => response.json())
            .then(data => {
                allQuestions = data.questions || [];
                currentPage = 1;
                renderPage();
                responseText.textContent = '';
            })
            .catch(error => {
                responseText.textContent = '無法載入題目，請稍後再試。';
                console.error('Error:', error);
            });
    } else {
        questionList.style.display = 'none';
    }
});

// 渲染指定頁數
function renderPage() {
    const questionList = document.getElementById('questionList');
    questionList.innerHTML = '';

    if (allQuestions.length === 0) {
        questionList.innerHTML = '<p>目前沒有題目</p>';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allQuestions.length);
    const pageQuestions = allQuestions.slice(startIndex, endIndex);

    pageQuestions.forEach(question => {
        const div = document.createElement('div');
        div.classList.add('question-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('question-checkbox');
        checkbox.value = question.id;

        const answerOptions = document.createElement('div');
        answerOptions.classList.add('answer-options');
        answerOptions.style.display = 'none';
        answerOptions.innerHTML = `
            <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
            <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
            <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
            <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
        `;

        const metadata = document.createElement('div');
        metadata.classList.add('metadata');
        metadata.style.display = 'none';
        metadata.innerHTML = `
            <strong>ID:</strong> ${question.id}<br>
            <strong>年度：</strong> ${question.year || '無年度'}<br>
            <strong>科目：</strong> ${question.subject || '無科目'}<br>
            <strong>類別：</strong> ${question.category || '無類別'}<br>
        `;

        const correctAnswer = document.createElement('div');
        correctAnswer.classList.add('correct-answer');
        correctAnswer.style.display = 'none';
        correctAnswer.innerHTML = `<strong>解答：</strong> ${question.correct_answer || '無解答'}`;

        const questionText = document.createElement('div');
        questionText.innerHTML = `<strong>問題：</strong> ${question.question_text || '無題目'}<br>`;

        const editBtn = document.createElement('button');
        editBtn.textContent = '編輯';
        editBtn.classList.add('edit-btn');
        editBtn.addEventListener('click', function () {
            editFrame.src = `/edit/${question.id}`;
            modal.style.display = 'flex';
        });

        const toggleDetailsBtn = document.createElement('button');
        toggleDetailsBtn.textContent = '顯示詳細';
        toggleDetailsBtn.classList.add('toggle-details-btn');
        toggleDetailsBtn.addEventListener('click', function () {
            const isVisible = answerOptions.style.display !== 'none';
            answerOptions.style.display = isVisible ? 'none' : 'block';
            metadata.style.display = isVisible ? 'none' : 'block';
            correctAnswer.style.display = isVisible ? 'none' : 'block';
            toggleDetailsBtn.textContent = isVisible ? '顯示詳細' : '隱藏詳細';
        });

        div.appendChild(checkbox);
        div.appendChild(questionText);
        div.appendChild(answerOptions);
        div.appendChild(metadata);
        div.appendChild(correctAnswer);
        div.appendChild(editBtn);
        div.appendChild(toggleDetailsBtn);

        questionList.appendChild(div);
    });

    renderPagination();
}

// 分頁按鈕
function renderPagination() {
    const questionList = document.getElementById('questionList');

    const paginationDiv = document.createElement('div');
    paginationDiv.classList.add('pagination');

    const totalPages = Math.ceil(allQuestions.length / itemsPerPage);

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '上一頁';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一頁';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(document.createTextNode(` 第 ${currentPage} 頁 / 共 ${totalPages} 頁 `));
    paginationDiv.appendChild(nextBtn);

    questionList.appendChild(paginationDiv);
}


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
document.getElementById('viewQuestionBtn').addEventListener('click', async function() {
    const questionId = document.getElementById('questionId').value;

    if (!questionId || isNaN(questionId)) {
        document.getElementById('response').textContent = '請輸入有效的數字ID！';
        return;
    }

    document.getElementById('response').textContent = '正在載入題目...';

    try {
        const questionResp = await fetch(`/api/questions/view_questions/${questionId}`);
        if (!questionResp.ok) throw new Error('題目資料取得失敗');
        const data = await questionResp.json();

        const imageResp = await fetch(`/api/questions/image_path/${questionId}`);
        if (!imageResp.ok) throw new Error('圖片路徑取得失敗');
        const imageData = await imageResp.json();
        const imagePath = imageData.image_path || '';

        const questionList = document.getElementById('questionList');
        questionList.innerHTML = '';

        if (!data) {
            questionList.innerHTML = '<p>找不到該題目，請確認 ID 是否正確。</p>';
        } else {
            const div = document.createElement('div');
            div.classList.add('question-item');

            div.innerHTML = `
                <strong>科目：</strong> ${data.subject || '無科目'}<br>
                <strong>年度：</strong> ${data.year || '無年度'}<br>
                <strong>類別：</strong> ${data.category || '無類別'}<br><br>
                ${imagePath ? `<img src="${imagePath}" style="max-width:400px;">` : ''}<br>
                <strong>ID:</strong> ${data.id}<br>
                <strong>問題：</strong> ${data.question_text || '無題目'}<br>
                <div class="answer-options">
                    <span><strong>A:</strong> ${data.option_a || '無選項'}</span><br>
                    <span><strong>B:</strong> ${data.option_b || '無選項'}</span><br>
                    <span><strong>C:</strong> ${data.option_c || '無選項'}</span><br>
                    <span><strong>D:</strong> ${data.option_d || '無選項'}</span><br>
                </div>
                <br><strong>解答：</strong> ${data.correct_answer || '無解答'}
            `;

            questionList.appendChild(div);
        }

        document.getElementById('response').textContent = '';
    } catch (error) {
        document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
        console.error('Error:', error);
    }
});

// ===================== 新增題目圖片 =====================
document.getElementById('imageBtn').addEventListener('click', function() {
    const questionId = document.getElementById('questionId').value;

    if (!questionId || isNaN(questionId)) {
        document.getElementById('response').textContent = '請輸入有效的數字ID！';
        return;
    }

    // 先打開檔案選擇視窗
    const fileInput = document.getElementById('imageFile');
    fileInput.value = ''; // 重置已選檔案
    fileInput.click();

    // 檔案選擇完成後自動上傳
    fileInput.onchange = function() {
        const imageFile = fileInput.files[0];
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('question_id', questionId);
        formData.append('image', imageFile);

        document.getElementById('response').textContent = '圖片上傳中...';

        fetch(`/api/questions/upload_image`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('response').textContent = `上傳失敗：${data.error}`;
            } else {
                document.getElementById('response').textContent = '圖片上傳成功！';
                console.log('圖片路徑：', data.image_path);
            }
        })
        .catch(error => {
            document.getElementById('response').textContent = '上傳時發生錯誤，請稍後再試。';
            console.error('Error:', error);
        });
    };
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

function searchQuestionsByKeyword(keyword) {
    // 移除頭尾空白並轉換為大寫以統一比較
    keyword = keyword.trim().toUpperCase();

    // 使用正則表達式解析關鍵字 (支援 AND, OR, NOT)
    const andParts = keyword.split(/\s+AND\s+/);
    let orParts = [];
    let notParts = [];

    andParts.forEach(part => {
        if (part.includes(" OR ")) {
            orParts.push(...part.split(/\s+OR\s+/));
        } else if (part.startsWith("NOT ")) {
            notParts.push(part.replace("NOT ", ""));
        } else {
            orParts.push(part);
        }
    });

    return questions.filter(question => {
        let questionText = question.question.toUpperCase();

        // 確保 AND 條件全部匹配
        if (andParts.length > 1 && !andParts.every(term => questionText.includes(term))) {
            return false;
        }

        // 確保 OR 條件至少匹配一個
        if (orParts.length > 0 && !orParts.some(term => questionText.includes(term))) {
            return false;
        }

        // 確保 NOT 條件都不匹配
        if (notParts.some(term => questionText.includes(term))) {
            return false;
        }

        return true;
    });
}


// ===================== 關鍵字 =====================
document.getElementById('filterByCategoryBtn').addEventListener('click', function () {
    const selectedCategory = document.getElementById('categoryInput').value.trim();

    if (!selectedCategory) {
        document.getElementById('response').textContent = '請輸入一個關鍵字！';
        return;
    }

    document.getElementById('response').textContent = '正在載入題目...';

    fetch('/api/questions/view_all_questions/')
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';

           const filteredQuestions = data.questions.filter(question =>
           matchesKeyword(question, selectedCategory)
);

            if (filteredQuestions.length === 0) {
                questionList.innerHTML = `<p>未找到符合關鍵字「${selectedCategory}」的題目。</p>`;
            } else {
                filteredQuestions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    // 建立 checkbox
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('question-checkbox');
                    checkbox.value = question.id;
                    div.appendChild(checkbox);

                    // 顯示基本資訊
                    div.appendChild(document.createTextNode(`科目：${question.subject || '無科目'}`));
                    div.appendChild(document.createElement('br'));

                    div.appendChild(document.createTextNode(`年度：${question.year || '無年度'}`));
                    div.appendChild(document.createElement('br'));

                    div.appendChild(document.createTextNode(`類別：${question.category || '無類別'}`));
                    div.appendChild(document.createElement('br'));
                    div.appendChild(document.createElement('br'));

                    div.appendChild(document.createTextNode(`ID: ${question.id}`));
                    div.appendChild(document.createElement('br'));

                    div.appendChild(document.createTextNode(`問題：${question.question_text || '無題目'}`));
                    div.appendChild(document.createElement('br'));

                    // 建立選項區塊
                    const optionsDiv = document.createElement('div');
                    optionsDiv.classList.add('answer-options');
                    optionsDiv.innerHTML = `
                        <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                        <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                        <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                        <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                    `;
                    div.appendChild(optionsDiv);

                    div.appendChild(document.createElement('br'));
                    questionList.appendChild(div);
                });
            }

            document.getElementById('response').textContent = '';
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
            console.error('Error:', error);
        });
});

function matchesKeyword(question, keyword) {
  const keywordUpper = keyword.trim().toUpperCase();
  const andParts = keywordUpper.split(/\s+AND\s+/);
  let orParts = [];
  let notParts = [];

  andParts.forEach(part => {
    if (part.includes(" OR ")) {
      orParts.push(...part.split(/\s+OR\s+/));
    } else if (part.startsWith("NOT ")) {
      notParts.push(part.replace("NOT ", "").trim());
    } else {
      orParts.push(part.trim());
    }
  });

  const searchable = [
    question.subject,
    question.year,
    question.category,
    question.id,
    question.question_text,
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
    question.correct_answer
  ].map(v => String(v).toUpperCase()).join(" ");

  if (andParts.length > 1 && !andParts.every(term => searchable.includes(term.trim()))) return false;
  if (orParts.length > 0 && !orParts.some(term => searchable.includes(term.trim()))) return false;
  if (notParts.some(term => searchable.includes(term.trim()))) return false;

  question._matched_terms = [...andParts, ...orParts]; // ✨ 用於高亮
  return true;
}

function highlightKeyword(text, keywords) {
  if (!text) return '';
  const terms = keywords.map(term => term.trim()).filter(t => t);
  let result = String(text);
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  return result;
}

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



// ===================== 查看考卷 ===================== 
document.getElementById('viewteat').addEventListener('click', async function () {
    document.getElementById('response').textContent = '正在載入考卷列表...';

    let currentUser = await getCurrentUser();

    fetch('/api/exam/view_exam/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: currentUser })
    })
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = ''; // 清空現有資料

        if (!data.exams || data.exams.length === 0) {
            questionList.innerHTML = '<p>目前沒有考卷。</p>';
            document.getElementById('response').textContent = '';
            return;
        }

        // ✅ 排序：建立時間由新到舊
        data.exams.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // 顯示每份考卷的標題與建立時間
        data.exams.forEach(exam => {
            const div = document.createElement('div');
            div.classList.add('exam-item');
            div.style.marginBottom = '1.5em';

            const title = document.createElement('p');
            title.innerHTML = `<strong>標題：</strong> ${exam.title}<br><strong>建立時間：</strong> ${exam.created_at}<br><strong>開考時間：</strong> ${exam.start_time}`;
            
            // ...（以下略，維持原邏輯）
        });


            // 顯示每份考卷的標題與建立時間
            data.exams.forEach(exam => {
                const div = document.createElement('div');
                div.classList.add('exam-item');
                div.style.marginBottom = '1.5em';

                const title = document.createElement('p');
                title.innerHTML = `<strong>標題：</strong> ${exam.title}<br><strong>建立時間：</strong> ${exam.created_at}<br><strong>開考時間：</strong> ${exam.start_time}`;

                const toggleButton = document.createElement('button');
                toggleButton.textContent = '查看題目';
                toggleButton.style.marginTop = '0.5em';

                const questionContainer = document.createElement('div');
                questionContainer.style.display = 'none';
                questionContainer.style.marginTop = '1em';

                // 展開按鈕邏輯
                toggleButton.addEventListener('click', async () => {
                    if (questionContainer.style.display === 'none') {
                        // 展開題目內容
                        try {
                            const questionIds = JSON.parse(exam.questions);
                            if (Array.isArray(questionIds) && questionIds.length > 0) {
                                const questions = await Promise.all(
                                    questionIds.map(id =>
                                        fetch(`/api/questions/view_questions/${id}`)
                                            .then(res => res.ok ? res.json() : null)
                                            .catch(() => null)
                                    )
                                );

                                questionContainer.innerHTML = '';
                                questions.forEach(question => {
                                    if (!question) return;

                                    const qDiv = document.createElement('div');
                                    qDiv.classList.add('question-item');

                                    // 顯示科目、年度、類別
                                    qDiv.innerHTML = `
                                        <strong>科目：</strong> ${question.subject || '無科目'}<br>
                                        <strong>年度：</strong> ${question.year || '無年度'}<br>
                                        <strong>類別：</strong> ${question.category || '無類別'}<br><br>
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
                                    qDiv.appendChild(optionsDiv);

                                    qDiv.innerHTML += `<br><strong>解答：</strong> ${question.correct_answer || '無解答'}`;

                                    questionContainer.appendChild(qDiv);
                                });

                                toggleButton.textContent = '隱藏題目';
                                questionContainer.style.display = 'block';
                            } else {
                                questionContainer.innerHTML = '<p>無題目資料。</p>';
                                questionContainer.style.display = 'block';
                            }
                        } catch (e) {
                            questionContainer.innerHTML = '<p>解析題目發生錯誤。</p>';
                            questionContainer.style.display = 'block';
                        }
                    } else {
                        // 收合
                        questionContainer.style.display = 'none';
                        toggleButton.textContent = '查看題目';
                    }
                });

                div.appendChild(title);
                div.appendChild(toggleButton);
                div.appendChild(questionContainer);
                questionList.appendChild(div);
            });

            document.getElementById('response').textContent = '';
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入考卷，請稍後再試。';
            console.error('Error:', error);
        });
});

// ===================== 查看學生列表 =====================

// 查看學生列表
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
                data.users.forEach(user => {
                    if (user.identities === "學生") {
                        const div = document.createElement('div');
                        div.classList.add('user-item');
                        div.innerHTML = `
                            <strong>帳號:</strong> ${user.username} <br>
                            <button onclick="booklink('${user.username}')">歷史紀錄</button>
                            <hr>
                        `;
                        questionList.appendChild(div);
                    }
                });
                                
            }
            document.getElementById('response').textContent = ''; // 清除提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入使用者，請稍後再試。';
            console.error('Error:', error);
        });
});

// 歷史紀錄顯示功能
async function booklink(currentUser) {
    if (!currentUser) {
        alert("無此帳號！");
        return;
    }

    try {
        const response = await fetch(`/api/questions/get_quiz_history/${currentUser}`);
        if (!response.ok) {
            throw new Error("無法從伺服器獲取歷史紀錄");
        }

        const resultData = await response.json();

        if (!resultData.history || resultData.history.length === 0) {
            alert("您目前沒有測驗歷史紀錄！");
            return;
        }

        const history = resultData.history;
        let historyHtml = `<h3>${currentUser} 的歷史紀錄：</h3>`;

        for (const [index, result] of history.entries()) {
            let score = 0;
            let incorrectCount = 0;

            const questionIds = result.question_number.map(q => q.questionNumber);
            const selectedAnswers = result.selected_answer.map(a => a.selectedAnswer);
            const totalQuestions = questionIds.length;

            // 建立 details 結構
            const details = questionIds.map((qId, i) => ({
                questionNumber: qId,
                selectedAnswer: selectedAnswers[i] || null
            }));

            // 取得正確答案
            let ans = [];
            try {
                const ansRes = await fetch('/api/questions/get_ans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: questionIds })
                });

                if (!ansRes.ok) throw new Error("伺服器回應錯誤");

                const ansData = await ansRes.json();
                ans = ansData.ans || [];
            } catch (error) {
                console.error('題目載入錯誤:', error);
                alert('載入題目時發生錯誤，請稍後再試');
                return;
            }

            // 取得題目內容
            const questions = await Promise.all(
                details.map(detail =>
                    fetch(`/api/questions/view_questions/${detail.questionNumber}`)
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                )
            );

            // 計算分數
            questions.forEach((q, i) => {
                const selectedAnswer = details[i].selectedAnswer;
                const correctAnswer = ans[i]?.gh || null;

                if (selectedAnswer === correctAnswer) {
                    score++;
                } else {
                    incorrectCount++;
                }
            });

            const scorePercentage = ((score / totalQuestions) * 100).toFixed(2);

            // 組合 HTML 顯示
            historyHtml += `
                <div>
                    <h4>測驗日期：${result.date}</h4>
                    <p>總分：${scorePercentage}%</p>
                    <p>錯誤題數：${incorrectCount}</p>
                    <button onclick="toggleDetails(${index})">顯示詳情</button>
                    <button onclick="exportToPDF(${index}, '${result.date}', ${score}, ${incorrectCount})">匯出 PDF</button>
                    <div id="details-${index}" style="display:none;">
                        <table border="1" id="table-${index}" style="width: 100%; text-align: left; color: black;">
                            <thead>
                                <tr>
                                    <th>題號</th>
                                    <th>題目</th>
                                    <th>選項</th>
                                    <th>您的答案</th>
                                    <th>正確答案</th>
                                    <th>詳解</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            details.forEach((detail, i) => {
                const question = questions[i];
                if (!question) return;

                const optionsHtml = `
                    <strong>A:</strong> ${question.option_a || '無'}<br>
                    <strong>B:</strong> ${question.option_b || '無'}<br>
                    <strong>C:</strong> ${question.option_c || '無'}<br>
                    <strong>D:</strong> ${question.option_d || '無'}
                `;

                historyHtml += `
                    <tr>
                        <td>${(i+1)}</td>
                        <td>${question.question_text || '無題目'}</td>
                        <td>${optionsHtml}</td>
                        <td>${detail.selectedAnswer || '未作答'}</td>
                        <td>${ans[i]?.gh || '無'}</td>
                        <td>${question.explanation || '無'}</td>
                    </tr>
                `;
            });

            historyHtml += `
                            </tbody>
                        </table>
                        <br>
                    </div>
                </div>
                <hr>
            `;
        }

        // 顯示在 popup 視窗中
        document.getElementById("popup-window").style.display = "block";
        document.getElementById("popup-title").textContent = "歷史紀錄";
        document.getElementById("popup-body").innerHTML = historyHtml;

    } catch (error) {
        console.error("獲取歷史紀錄時發生錯誤：", error);
        alert("無法獲取歷史紀錄，請稍後再試！");
    }
};

// 匯出 PDF 功能（自動讀取 TTF 字體）
function exportToPDF(index, date, score, incorrectCount) {
    const fontAPI = "/api/fonts/fontnoto"; // API 端點

    fetch(fontAPI)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
                const base64Font = reader.result.split(',')[1]; // 取得 Base64 字串
                generatePDF(base64Font, index, date, score, incorrectCount);
            };
        })
        .catch(error => {
            console.error("無法載入字體:", error);
            alert("無法載入字體，請檢查 API 是否正常運作！");
        });
}

// 產生 PDF
function generatePDF(base64Font, index, date, score, incorrectCount) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.addFileToVFS("NotoSansTC-Regular.ttf", base64Font);
    doc.addFont("NotoSansTC-Regular.ttf", "NotoTC", "normal");
    doc.setFont("NotoTC");

    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text("測驗歷史紀錄", 10, 15);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`📅 測驗日期：${date}`, 10, 25);
    doc.text(`✅ 總分：${score}%`, 10, 35);
    doc.text(`❌ 錯誤題數：${incorrectCount}`, 10, 45);

    const table = document.getElementById(`table-${index}`);
    if (!table) {
        alert("無法找到表格，請重試！");
        return;
    }

    const rows = table.querySelectorAll("tr");
    const tableData = [];

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td, th");
        const rowData = [];

        cells.forEach(cell => {
            rowData.push(cell.innerText.trim());
        });

        if (rowIndex === 0) {
            tableData.unshift(rowData);
        } else {
            tableData.push(rowData);
        }
    });

    doc.autoTable({
        startY: 55,
        head: [tableData[0]],
        body: tableData.slice(1),
        headStyles: {
            fillColor: [0, 51, 102],
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        bodyStyles: {
            textColor: [0, 0, 0],
        },
        alternateRowStyles: {
            fillColor: [230, 230, 230],
        },
        styles: {
            font: "NotoTC",
            fontSize: 10,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 15 },  // 題號
            1: { cellWidth: 60 },  // 題目
            2: { cellWidth: 80 },  // 選項
            3: { cellWidth: 20 },  // 您的答案
            4: { cellWidth: 20 },  // 正確答案
            5: { cellWidth: 70 },  // 詳解
        }
        
    });

    doc.save(`測驗紀錄_${date}.pdf`);
}

// 切換顯示/隱藏詳情的函數
function toggleDetails(index) {
    const detailsDiv = document.getElementById(`details-${index}`);
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
    } else {
        detailsDiv.style.display = "none";
    }
}

// 關閉視窗
document.getElementById("close-popup").addEventListener("click", function() {
    document.getElementById("popup-window").style.display = "none";
});

// ===================== 隨機生成考卷 =====================
document.getElementById('filter-search-button').addEventListener('click', function() {
    const subject = document.getElementById('subject').value;
    const category = document.getElementById('category').value;
    const year = document.getElementById('year').value;
    const questionType = document.getElementById('question-type').value;
    const questionCount = document.getElementById('question-count').value; // 保持為字串形式

    // 搜尋結果
    const searchResults = searchQuestions(subject, category, year, questionType, questionCount); // 增加 questionCount 參數
    
    if (searchResults.length > 0) {
    } else {
        alert('未找到符合條件的題目。');
    }
});

function searchQuestions(subject, category, year, questionType, questionCount) {
    let filteredQuestions = questions.filter(question => {
        return (
            (subject === "全部" || subject === "" || question.subject === subject) &&
            (category === "全部" || category === "" || question.category === category) && // 修正這一行
            (year === "全部" || year === "" || question.year.toString() === year.toString()) &&
            (questionType === "全部" || questionType === "" || question.type === questionType)
        );
    });

    // 題數處理
    if (questionCount !== "全部" && questionCount !== "" && !isNaN(Number(questionCount))) {
    const count = Number(questionCount);

        // Fisher-Yates 洗牌演算法
        for (let i = filteredQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filteredQuestions[i], filteredQuestions[j]] = [filteredQuestions[j], filteredQuestions[i]];
        }

        // 取前 N 題
        filteredQuestions = filteredQuestions.slice(0, count);

        randomtest(filteredQuestions);
        
    }

    // 單獨處理 category 為 "全部" 的情況
    if (category === "全部") {
        return filteredQuestions;
    } else {
        return filteredQuestions.filter(question => question.category === category);
    }
}

async function randomtest (filteredQuestions){
    // 取得當前使用者 ID
    let currentUser = await getCurrentUser();
    
    const selectedQuestions = filteredQuestions.map(q => q.questionNumber);

    // 顯示提示視窗讓使用者輸入考試標題
    const examTitle = prompt('請輸入考試標題：');

    if (!examTitle || examTitle.trim() === "") {
        responseDiv.textContent = '請輸入有效的考試標題！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    if (!currentUser) {
        responseDiv.textContent = '請先登入再生成考卷！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    // 取得當前時間 +8 小時並格式化
    const now = new Date();
    now.setHours(now.getHours() + 8);
    now.setSeconds(0);
    const defaultStartTime = now.toISOString().slice(0, 19).replace('T', ' ');

    // 使用者輸入考試時間（本地時間），我們會轉成 ISO 格式
    const startTimeInput = prompt('請輸入開始考試時間 (YYYY-MM-DD HH:mm:ss)，預設為當前時間：', defaultStartTime);
    let startTime = startTimeInput ;

    // 顯示提示讓使用者輸入作答時間（秒）
    const durationInput = prompt('請輸入作答時間（秒），預設為 3600 秒（一小時）：', '3600');
    let duration = durationInput ? parseInt(durationInput) : 3600;

    if (!currentUser) {
        responseDiv.textContent = '請先登入再生成考卷！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    console.log('傳送的資料:', JSON.stringify({
        creator_id: currentUser,
        selectedQuestions: selectedQuestions,
        title: examTitle,
        start_time: startTime,
        duration: duration
    }));

    try {
        const response = await fetch('/api/exam/generate-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creator_id: currentUser,
                selectedQuestions: selectedQuestions,
                title: examTitle,
                start_time: startTime,
                duration: duration
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('考卷生成成功:', result);
            responseDiv.textContent = `考卷「${examTitle}」生成成功！`;
        } else {
            responseDiv.textContent = `生成考卷失敗: ${result.detail}`;
        }

    } catch (error) {
        console.error('請求錯誤:', error);
        responseDiv.textContent = '發生錯誤，請稍後再試！';
    } finally {
        button.disabled = false;
        button.textContent = "生成考卷";
    }
}

function toggleInputField(field) {
    let selectElement = document.getElementById(field);
    let inputElement = document.getElementById(field + "-input");

    if (selectElement.value === "自行輸入") {
        inputElement.style.display = "inline-block";
        inputElement.focus();
    } else {
        inputElement.style.display = "none";
        inputElement.value = ""; // 清空輸入框
    }
}

function handleKeyPress(event, field) {
    if (event.key === "Enter") {
        let inputElement = event.target;
        let selectElement = document.getElementById(field);
        let value = inputElement.value.trim();

        if (value) {
            // 添加新選項到下拉選單並選擇它
            let newOption = new Option(value, value);
            selectElement.add(newOption);
            selectElement.value = value;

            // 隱藏輸入框並清空
            inputElement.style.display = "none";
            inputElement.value = "";

            // 觸發 change 事件以便其他邏輯可以檢測到新值
            let changeEvent = new Event('change');
            selectElement.dispatchEvent(changeEvent);
        }
    }
}

// 為每個自行輸入的輸入框添加事件監聽器
document.getElementById('category-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'category');
});
document.getElementById('subject-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'subject');
});
document.getElementById('year-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'year');
});
document.getElementById('question-count-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'question-count');
});


// 控制批改區是否顯示
let gradingVisible = false;

// 點擊按鈕切換批改區顯示與隱藏
document.getElementById("gradingAreaBtn").addEventListener("click", () => {
    gradingVisible = !gradingVisible; // 切換狀態

    // 根據狀態顯示或隱藏
    document.getElementById("grading-area").style.display = gradingVisible ? "block" : "none";

    // 若顯示時，自動載入該學生的批改資料
    if (gradingVisible) {
        const studentId = document.getElementById("studentIdInput").value.trim();
        if (studentId) loadGrading(studentId);
    }
});

// 提交批改資料
document.getElementById("submitGradingBtn").addEventListener("click", () => {
    const studentId = document.getElementById("studentIdInput").value.trim();
    const score = document.getElementById("scoreInput").value;
    const comment = document.getElementById("commentInput").value;

    if (!studentId || score === "" || comment === "") {
        alert("⚠️ 請填寫完整資料！");
        return;
    }

    const data = { studentId, score, comment };

    fetch("/api/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.ok) {
            alert("✅ 批改資料已儲存！");
        } else {
            alert("❌ 儲存失敗，請稍後再試！");
        }
    })
    .catch(err => {
        console.error("送出錯誤：", err);
        alert("⚠️ 伺服器錯誤！");
    });
});

// 讀取已存在的批改資料（可在點擊查詢或顯示時自動載入）
function loadGrading(studentId) {
    fetch(`/api/grading/${studentId}`)
        .then(res => {
            if (!res.ok) throw new Error("查無資料");
            return res.json();
        })
        .then(data => {
            document.getElementById("scoreInput").value = data.score;
            document.getElementById("commentInput").value = data.comment;
        })
        .catch(() => {
            console.log("❔ 尚無批改紀錄");
            document.getElementById("scoreInput").value = "";
            document.getElementById("commentInput").value = "";
        });
}

// 格式化台灣時間為 YYYY-MM-DD HH:mm:ss
function formatTaipeiTime(dateString) {
    const taipeiDate = new Date(dateString);
    const options = {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const parts = new Intl.DateTimeFormat('zh-TW', options).formatToParts(taipeiDate);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

// 生成考卷
document.getElementById('copytest').addEventListener('click', async function () {
    const button = this;
    const responseDiv = document.getElementById('response');
    responseDiv.textContent = '請填寫考試資訊...';
    button.disabled = true;

    // 設定預設開始時間為當前時間 +8 小時
    const now = new Date();
    now.setHours(now.getHours() + 8);
    now.setSeconds(0);
    now.setMilliseconds(0);
    const defaultStartTime = now.toISOString().slice(0, 16); // datetime-local 格式
    document.getElementById('startTimeInput').value = defaultStartTime;
    document.getElementById('examModal').style.display = 'block';

    document.getElementById('confirmExam').onclick = async function () {
        const examTitle = document.getElementById('examTitleInput').value.trim();
        const startTimeRaw = document.getElementById('startTimeInput').value;
        const durationMinutes = parseInt(document.getElementById('durationInput').value) || 60;

        if (!examTitle) {
            responseDiv.textContent = '請輸入有效的考試標題！';
            button.disabled = false;
            return;
        }

        const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
                                       .map(checkbox => parseInt(checkbox.value));
        if (selectedQuestions.length === 0) {
            responseDiv.textContent = '請先勾選至少一個題目！';
            button.disabled = false;
            return;
        }

        // 將開始時間轉成台灣時間格式
        const startTimeFormatted = formatTaipeiTime(startTimeRaw);
        const duration = durationMinutes * 60;

        let currentUser = await getCurrentUser();
        if (!currentUser) {
            responseDiv.textContent = '請先登入再生成考卷！';
            button.disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/exam/generate-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creator_id: currentUser,
                    selectedQuestions,
                    title: examTitle,
                    start_time: startTimeFormatted,
                    duration: duration
                })
            });

            const result = await response.json();
            if (response.ok) {
                responseDiv.textContent = `考卷「${examTitle}」生成成功！開始時間（台灣時間）：${startTimeFormatted}`;
            } else {
                responseDiv.textContent = `生成考卷失敗: ${result.detail}`;
            }
        } catch (error) {
            console.error('請求錯誤:', error);
            responseDiv.textContent = '發生錯誤，請稍後再試！';
        } finally {
            button.disabled = false;
            document.getElementById('examModal').style.display = 'none';
        }
    };
});

// ===================== 新增學生 =====================
document.getElementById("addstudent").addEventListener("click", async function() {

    const newUsernameInput = prompt('請輸入學生名');
    let newUsername = newUsernameInput ;

    const newPasswordInput = prompt('請輸入密碼');
    let newPassword = newPasswordInput ;

    let newidentities ="學生"
    
    try {
        // 向 FastAPI 發送註冊請求
        const response = await fetch("/api/save_users/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: newUsername, password: newPassword, identities: newidentities})
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message); // 顯示註冊成功訊息
        } else {
            const errorData = await response.json();
            alert(errorData.detail || "註冊失敗");
        }
    } catch (error) {
        alert("發生錯誤，請稍後再試！");
        console.error(error);
    }
    
});