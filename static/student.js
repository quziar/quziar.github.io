let questions = [];
let questionIds = [];

// 載入題庫資料
async function fetchQuestions() {
    try {
        let response = await fetch("/api/questions/read_questions/");
        let data = await response.json();
        questions = data.questions;

        // 從載入的題目中提取出題目 ID 並設定 questionIds
        questionIds = questions.map(question => question.id);
        
        console.log("載入的題目：", questions);
    } catch (error) {
        console.error("獲取題庫資料時出錯:", error);
    }
}

// 取得當前使用者 ID（使用 session，不用 token）
async function getCurrentUser() {
    const response = await fetch('/api/session/get_user/', {
        credentials: 'include'  // ⬅️ 讓 iOS、Safari 能帶上 cookie（session ID）
    });

    if (response.ok) {
        const data = await response.json();
        return data.currentUserID;
    } else {
        console.log('未登入');
        return null;
    }
}


// 全域變數
let currentQuestionIndex = 0;
let selectedOption = null;
let score = 0;
let incorrectCount = 0;
let timerInterval = null;
let remainingTime = 0;
let timer; // 將 timer 變數設置為全域範圍
let markedQuestionIndex = null; // 新增標記題目索引
let completedQuestions = new Set(); // 新增已完成題目集合
let totalQuestions = questions.length;
let currentUser = getCurrentUser();
let selectedans = [];

// 異步函數來獲取當前用戶並更新全域變數
async function setCurrentUser() {
    try {
        // 等待 getCurrentUser() 完成
        currentUser = await getCurrentUser(); 

        if (!currentUser) {
            
        } else {
            console.log("當前用戶:", currentUser);
        }
    } catch (error) {
        console.error("錯誤：", error);
    }
}

setCurrentUser().then(() => {
    console.log("全域變數 currentUser 設置完成");
});


// 顯示/隱藏 eliminate 選項按鈕區塊（固定寫法）
document.getElementById("eliminate-option").addEventListener("click", () => {
    const eliminateContainer = document.getElementById("eliminate-container");
    eliminateContainer.style.display = eliminateContainer.style.display === "none" ? "block" : "none";
});

// 委派監聽 eliminate 按鈕（適用所有 .eliminate-option，動態產生也可用）
document.getElementById("eliminate-container").addEventListener("click", function (e) {
    const button = e.target.closest(".eliminate-option");
    if (!button) return;

    const optionToEliminate = button.getAttribute("data-option");
    const question = questions[currentQuestionIndex];
    const optionIndex = ["A", "B", "C", "D"].indexOf(optionToEliminate);

    if (!question.eliminatedOptions) question.eliminatedOptions = [];

    if (question.eliminatedOptions.includes(optionIndex)) {
        question.eliminatedOptions = question.eliminatedOptions.filter(i => i !== optionIndex);
    } else {
        question.eliminatedOptions.push(optionIndex);
    }

    showQuestion(); // 重新渲染題目與選項狀態
});

//清單控制
document.addEventListener("DOMContentLoaded", () => {
  const mainAccountLink = document.getElementById("main-account-link");
  const dropdown = document.getElementById("account-dropdown");

  // 點擊切換下拉選單
  mainAccountLink.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });

  // 點擊外部關閉下拉
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".account-menu")) {
      dropdown.style.display = "none";
    }
  });
});

//進入個人資料頁面
async function settingFunction() {
    window.location.replace("/static/profiles.html");
}

function showQuestionList() {
    totalQuestions = questions.length;
    const questionListContainer = document.getElementById('question-list');
    const selectElement = document.getElementById("question-type-select");
    // 判斷是否為一般模式
    const isGeneralMode = selectElement.value === "general";

    questionListContainer.innerHTML = questions.map((question, index) => {
        const isMarked = question.marked;
        const isAnswered = isGeneralMode && question.answered;

        // 設定按鈕背景顏色
        let buttonStyle = "";
        if (isAnswered) {
            buttonStyle = "background-color: blue; color: white; border: 2px solid blue;";
        } else {
            buttonStyle = "background-color: white; color: black; border: 1px solid #ccc;";
        }

        // 設定題號文字顏色
        let numberStyle = "";
        if (isMarked) {
            numberStyle = "color: yellow; font-weight: bold;";
        } else if (!isAnswered) {
            numberStyle = "color: black;";
        } else {
            numberStyle = "color: white;"; // 已作答、未標記，藍底白字
        }

        const displayNumber = index + 1;

        return `<button title="${question.question}" onclick="jumpToQuestion(${index})" style="${buttonStyle}">
            ${isGeneralMode ? `<span style="${numberStyle}">${displayNumber}</span>` : `${displayNumber}.`} 
            ${!isGeneralMode && question.selectedAnswer ? `(${question.selectedAnswer})` : ''}
        </button>`;
    }).join('');

}

function toggleQuestionList() {
    const selectElement = document.getElementById("question-type-select");  
    const questionList = document.getElementById("question-list");

    // 顯示選擇的模式，檢查是否有正確觸發
    console.log("Mode Changed: ", selectElement.value);

    // 根據選擇的模式設定類別
    if (selectElement.value === "general") {
        questionList.className = "general";
    } else {
        questionList.className = "advanced";
    }

    // 重新渲染題目列表
    showQuestionList();
}

function jumpToQuestion(index) {
    currentQuestionIndex = index;
    const question = questions[index];
    const isChoice = question.type === "選擇";

    // 🔧 控制 eliminate 按鈕的顯示（只針對選擇題）
    const eliminateBtn = document.getElementById("eliminate-option");
    const eliminateBox = document.getElementById("eliminate-container");
    if (eliminateBtn && eliminateBox) {
        eliminateBtn.style.display = isChoice ? "inline-block" : "none";
        eliminateBox.style.display = "none"; // 每次切題都收起來
    }

    // 🖼️ 渲染該題
    showQuestion(index);
}

function showQuestion(index) {
    const questionContainer = document.getElementById('question-container');
    const question = questions[currentQuestionIndex];
    const optionLabels = ["A", "B", "C", "D"];
    index++;

    // 顯示題號列表
    showQuestionList();

    // 處理下一題按鈕
    const nextButton = document.getElementById('next-question');
    nextButton.disabled = (currentQuestionIndex === questions.length - 1);


    // 顯示當前題目
questionContainer.innerHTML = `
    <div class="question-header">${question.year} ${question.category} ${question.marked ? '⭐' : ''}</div>
    <h2>${index}. ${question.question}</h2>
    ${question.image ? `<img src="${question.image}" style="max-width:400px;">` : ""}
    
    ${
        question.type === "申論"
        ? `
        <!-- 符號工具列獨立區塊 (放上方) -->
        <div id="symbol-toolbar" style="margin-top:5px; flex-wrap:wrap; display:flex; gap:4px;">
            <button type="button" onclick="insertSymbol('，')">，</button>
            <button type="button" onclick="insertSymbol('。')">。</button>
            <button type="button" onclick="insertSymbol('；')">；</button>
            <button type="button" onclick="insertSymbol('：')">：</button>
            <button type="button" onclick="insertSymbol('！')">！</button>
            <button type="button" onclick="insertSymbol('？')">？</button>
            <button type="button" onclick="insertSymbol('—')">—</button>
            <button type="button" onclick="insertSymbol('※')">※</button>
            <button type="button" onclick="insertSymbol('（')">（</button>
            <button type="button" onclick="insertSymbol('）')">）</button>
            <button type="button" onclick="insertSymbol('[')">[</button>
            <button type="button" onclick="insertSymbol(']')">]</button>
            <button onclick="undo()">↺</button>
            <button onclick="formatText('fontSize')">A</button>
            <button onclick="formatText('fontFamily')">F</button>
        </div>

        <style>
            #symbol-toolbar button {
                width: 48px;
                height: 48px;
                font-size: 22px;
                display: flex;
                justify-content: center;  /* 水平置中 */
                align-items: center;      /* 垂直置中 */
                padding: 0;
                border-radius: 6px;
                cursor: pointer;
                font-family: "Arial", "Helvetica", sans-serif; /* 字體避免偏移 */
            }
            #symbol-toolbar button:hover {
                background-color: #f0f0f0;
            }
        </style>



            <!-- 答題區獨立區塊 (放下方) -->
            <div contenteditable="true" 
                 id="written-answer" 
                 class="lined-textarea" 
                 placeholder="請在此輸入答案...">${question.answer || ''}</div>
          `
        : `
            <div class="option-container">
                ${question.options.map((option, i) => `
                    <button class="option ${question.selectedAnswer === optionLabels[i] ? 'selected' : ''} ${question.eliminatedOptions?.includes(i) ? 'eliminated' : ''}" 
                        style="text-decoration: ${question.eliminatedOptions?.includes(i) ? 'line-through' : 'none'};" 
                        data-index="${i}">
                        <span style="color: black;">${optionLabels[i]}</span>. ${option}
                    </button>
                `).join('')}
            </div>
          `
    }

    <div class="note-container" style="display: ${question.marked ? 'block' : 'none'}; margin-top: 10px;">
        <textarea id="note-input" placeholder="輸入筆記..." style="width: 100%; height: 80px;">${question.note || ''}</textarea>
    </div>
`;

// 申論題答案輸入框
const writtenAnswer = document.getElementById('written-answer');
if (writtenAnswer) {
 writtenAnswer.addEventListener('input', function() {
     question.answer = this.innerHTML; // 取代 value 以支援 HTML 格式
 });
}

 // 選項按鈕功能（非申論題）
if (question.type !== "申論") {
        document.querySelectorAll('.option').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.option').forEach(btn => btn.classList.remove('selected'));
                this.classList.add('selected');
                selectedOption = parseInt(this.getAttribute('data-index'));
                questions[currentQuestionIndex].answered = true;
                questions[currentQuestionIndex].selectedAnswer = optionLabels[selectedOption];
                showQuestionList();
            });
        });
    }

    // 監聽標記按鈕的點擊事件（不創建新按鈕，直接綁定）
    const markButton = document.getElementById('mark-question');
    if (markButton) {
        markButton.onclick = function() {
            questions[currentQuestionIndex].marked = !questions[currentQuestionIndex].marked;
            showQuestion(currentQuestionIndex);
        };
    }

    // 監聽筆記輸入變更
    const noteInput = document.getElementById('note-input');
    if (noteInput) {
        noteInput.addEventListener('input', function() {
            questions[currentQuestionIndex].note = this.value;
        });
    }
}

document.getElementById('add-question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    showQuestionList();
});
//未做完測試
document.getElementById('vieactice').addEventListener('click', function() {
    const responseEl = document.getElementById('response');
    const questionList = document.getElementById('questionList');

    responseEl.textContent = '正在載入未完成題目...';
    questionList.innerHTML = '';

    fetch(`/api/SL/load`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: currentUser })  // 将 name 作为请求体的一部分
    })
        .then(response => response.json())
        .then(data => {
            if (!data.save || data.save.length === 0) {
                questionList.innerHTML = '<p>目前沒有任何存檔</p>';
                responseEl.textContent = '';
                return;
            }

            let hasIncomplete = false;

            data.save.forEach(save => {
                let answers = [];

                if (typeof save.selected_answer === 'string') {
                    try {
                        answers = JSON.parse(save.selected_answer);
                    } catch (err) {
                        answers = save.selected_answer.split(',');
                    }
                } else if (Array.isArray(save.selected_answer)) {
                    answers = save.selected_answer;
                }

                const answersWithIndex = answers.map((ans, idx) => {
                    return `第${idx + 1}題: ${ans && ans.trim() !== '' ? ans : '無作答'}`;
                });

                const hasEmpty = answersWithIndex.some(ans => ans.includes('無作答'));

                if (hasEmpty) {
                    hasIncomplete = true;

                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    const continueBtn = document.createElement('button');
                    continueBtn.textContent = '繼續作答';

                    // 🔹 點擊後直接載入考卷到 questions
                    continueBtn.addEventListener('click', function() {
                        fetch(`/api/SL/start_exam?title=${encodeURIComponent(save.exam_title)}`)
                            .then(res => res.json())
                            .then(examData => {
                                questions = examData.questions || [];
                                currentQuestionIndex = 0;
                                selectedans = [];
                                completedQuestions = new Set();

                                // 用現有函數渲染第一題
                                showQuestion(currentQuestionIndex);

                                alert(`已載入考卷「${examData.title}」，準備繼續作答！`);
                            })
                            .catch(err => {
                                console.error('載入考卷失敗', err);
                                alert('無法載入考卷，請稍後再試');
                            });
                    });

                    div.innerHTML = `
                        <strong>學生名：</strong> ${save.username || '訪客'}<br>
                        <strong>考卷名稱：</strong> ${save.exam_title || '未命名'}<br>
                        <strong>答案：</strong><br> ${answersWithIndex.join('<br>')}<br>
                        <strong>結束時間：</strong> ${save.endtime || '無結束時間'}<br>
                    `;

                    div.appendChild(continueBtn);
                    questionList.appendChild(div);
                }
            });

            if (!hasIncomplete) {
                questionList.innerHTML = '<p>所有題目都已完成，沒有「未作答」的紀錄。</p>';
            }

            responseEl.textContent = '';
        })
        .catch(error => {
            responseEl.textContent = '無法載入題目，請稍後再試。';
            console.error('Error:', error);
        });
});

//

showQuestionList(); // 初始化顯示題目列表
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


// 初始化
document.addEventListener('DOMContentLoaded', function() {

    document.getElementById("sidebar").style.display = "none";

    // 選擇全部按鈕
    selectAllButton.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.question-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    });

    // 清除全部按鈕
    clearSelectionButton.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.question-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    });

    // 開始測驗按鈕
    startQuizButton.addEventListener('click', function() {
        const selectedQuestions = [];
        const checkboxes = document.querySelectorAll('.question-checkbox:checked');
        checkboxes.forEach(checkbox => {
            const questionIndex = parseInt(checkbox.value);
            selectedQuestions.push(questions[questionIndex]);
        });

        if (selectedQuestions.length > 0) {
            startQuiz(selectedQuestions); // 開始測驗
        } else {
            alert('請選擇至少一題題目進行測驗。');
        }
    });
});
window.onload = () => {
  fetch('/api/exam/view_exam_title/')
    .then(r => r.json())
    .then(d => exam.innerHTML = '<option value="default">考卷</option>' +
      (d.exams || []).slice().reverse().map(e => `<option value="${e.id}">${e.title}</option>`).join(''))
    .catch(() => exam.innerHTML += '<option value="">無法載入</option>');
};




// 開始測驗函數
function startQuiz(selectedQuestions) {
    // 隱藏搜尋結果和顯示測驗介面
    document.getElementById('filter-search-container').style.display = 'none'; // 隱藏 filter-search-container
    document.getElementById('container');

    // 初始化測驗題目
    questions.length = 0;
    questions.push(...selectedQuestions);
    currentQuestionIndex = 0;
    showQuestion(currentQuestionIndex);
    
    // 顯示測驗相關按鈕
    document.querySelector('.button-container').style.display = 'flex';
}


// 搜尋題目函數
document.getElementById('toggle-question-list').addEventListener('click', function() {
    const questionList = document.getElementById('question-list');
    if (questionList.style.visibility === 'hidden') {
        questionList.style.visibility = 'visible';
        questionList.style.height = 'auto';
    } else {
        questionList.style.visibility = 'hidden';
        questionList.style.height = '0px';
    }
});

// 其他搜尋功能
document.getElementById('filter-search-button').addEventListener('click', async function () {
    const subject = document.getElementById('subject').value.trim();
    const category = document.getElementById('category').value.trim();
    const year = document.getElementById('year').value.trim();
    const questionType = document.getElementById('question-type').value.trim();
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    const questionCount = document.getElementById('question-count').value.trim();

    try {
        const response = await fetch('/api/questions/search_questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject,
                category,
                year,
                questionType,
                questionCount
            })
        });

        const data = await response.json();

        if (data.success && data.question_ids.length > 0) {
            questionIds = data.question_ids;

            questions.length = 0; // 清空舊題目
            document.getElementById('start-quiz').style.display = 'block'; // 顯示開始測驗按鈕
            document.getElementById('start-quiz').dataset.timeLimit = timeLimit; // 設置時間限制

            console.log("取得的題目 IDs:", questionIds);
        } else {
            alert('未找到符合條件的題目。');
        }
    } catch (error) {
        console.error("發生錯誤：", error);
        alert('搜尋題目時發生錯誤');
    }
});

// 選擇考卷
document.getElementById('exam').addEventListener('change', async e => {
  if (e.target.value !== 'default') {
    try {
      const selectedTitle = e.target.options[e.target.selectedIndex].text;
      console.log('Selected Title:', selectedTitle);

      // 取得考卷資料（包含題目 IDs）
      const examRes = await fetch(`/api/exam/start_exam?title=${encodeURIComponent(selectedTitle)}`);
      if (!examRes.ok) {
        throw new Error('無法載入考卷資料');
      }
      const examData = await examRes.json();
      console.log('Exam Data:', examData);

      // 解析問題 ID 字串為陣列
      questionIds = JSON.parse(examData.questions); // 這裡將字串轉為陣列
      questionIds.sort(() => Math.random() - 0.5);
      console.log('Question IDs:', questionIds);

      if (!questionIds || questionIds.length === 0) {
        alert('該考卷無題目');
        return;
      }

      document.getElementById('start-quiz').style.display = 'block'; // 顯示開始測驗按鈕
      try {
        const examRes = await fetch(`/api/exam/exam_duration?title=${encodeURIComponent(selectedTitle)}`);
        if (!examRes.ok) {
            throw new Error('無法載入考卷資料');
        }

        const data = await Res.json();
        document.getElementById('start-quiz').dataset.timeLimit = data.duration;
        } catch (error) {
        console.error('載入考試時間限制時發生錯誤：', error);
        }


      console.log('題目載入成功', questions);

    } catch (err) {
      console.error('題目載入錯誤', err);
      alert('發生錯誤，請稍後再試');
    }
  }
  else {
      document.getElementById('start-quiz').style.display = 'none';
  }
});




// 開始測驗按鈕事件監聽
document.getElementById('start-quiz').addEventListener('click', async function() {
    document.getElementById("sidebar").style.display = "block";
    document.getElementById('start-quiz').style.display = 'none';
    document.getElementById('filter-search-container').style.display = 'none'; // 隱藏篩選搜尋選單
    document.getElementById('exam').style.display = 'none';
    document.getElementById('question-container').style.display = 'block';
    document.querySelector('.button-container').style.display = 'flex';
    document.getElementById("pause-timer").style.display = "none";//隱藏時間暫停按鈕
    

    const timeLimit = parseInt(this.dataset.timeLimit);
    if (timeLimit > 0) {
        startTimer(timeLimit);
    }

    try {
        // 呼叫 API，根據 ID 陣列取得完整題目
        const questionRes = await fetch('/api/questions/fetch_by_ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: questionIds })
        });

        const questionData = await questionRes.json();
        console.log('Question Data:', questionData);

        if (!questionData.questions || questionData.questions.length === 0) {
            alert('題目資料載入失敗');
            return;
        }

        // 設定全域題目變數
        questions.length = 0;
        questions.push(...questionData.questions);
        selectedAns = new Array(questions.length).fill("");
        showQuestion(0);
    } catch (error) {
        console.error('題目載入時發生錯誤:', error);
        alert('載入題目時發生錯誤，請稍後再試');
    }
});


function selectAnswer(questionIndex, answer) {
    questions[questionIndex].selectedAnswer = answer;
    // 不再在這裡標記已完成，因為標記完成的邏輯應該放在點擊「送出」後處理
}

document.getElementById('start-quiz').addEventListener('click', async function () {
  // 顯示測驗區塊
  document.getElementById("sidebar").style.display = "block";
  document.getElementById('question-container').style.display = 'block';
  document.querySelector('.button-container').style.display = 'flex';
  document.getElementById("pause-timer").style.display = "none";

  // 隱藏所有選題／練習／搜尋區塊
  const elementsToHide = [
    'start-quiz',
    'filter-search-container',
    'exam',
    'practiceSelect',
    'viewAllBtn',
    'keywordBlock',
    'filterByCategoryBtn',
    'copytest',
    'viewteat',
    'generatePractice',
    'viewPractice',
    'practiceResponse',
    'practiceResultList',
    'filteredQuestionList',
    'response',
    'questionList',
    'add-question-form'
  ];
  elementsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // 啟動計時器（如果有限）
  const timeLimit = parseInt(this.dataset.timeLimit);
  if (timeLimit > 0) startTimer(timeLimit);

  // 載入題目並開始測驗
  try {
    const questionRes = await fetch('/api/questions/fetch_by_ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: questionIds })
    });

    const questionData = await questionRes.json();
    if (!questionData.questions || questionData.questions.length === 0) {
      alert('題目資料載入失敗');
      return;
    }

    questions.length = 0;
    questions.push(...questionData.questions);
    showQuestion(0);
  } catch (error) {
    console.error('題目載入時發生錯誤:', error);
    alert('載入題目時發生錯誤，請稍後再試');
  }
});

// 設置確認答案按鈕的點擊事件
document.getElementById('confirm-answer').addEventListener('click', function() {
    const question = questions[currentQuestionIndex];

    // 處理申論題型
    if (question.type === "申論") {
        // 獲取申論題答案
        const writtenAnswer = document.getElementById('written-answer').innerHTML.trim(); // 使用 innerHTML 以支援格式
        if (writtenAnswer === "") {
            alert('請輸入答案。');
            return; // 若答案為空，提示用戶並返回
        }
        question.answered = true; // 標記題目已作答
        question.answer = writtenAnswer; // 儲存申論題的答案
        save(currentQuestionIndex,writtenAnswer);
        completedQuestions.add(currentQuestionIndex); // 將當前題目標記為已完成
    } 
    // 處理選擇題型
    else {
        // 若用戶未選擇答案，提示用戶
        if (!question.selectedAnswer) { 
            alert('請選擇一個選項。'); 
            return; 
        }
        question.answered = true; // 標記題目已作答
        save(currentQuestionIndex,question.selectedAnswer);
        completedQuestions.add(currentQuestionIndex); // 將當前題目標記為已完成
    }

    // 移動到下一題
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion(currentQuestionIndex); // 顯示下一題
    } else {
        alert("所有題目已完成！"); // 提示用戶所有題目已完成
    }
});

async function save(questionNumber, answer) {
    selectedans[questionNumber] = answer;

    try {
        // 轉成陣列，確保跟 questionIds 對齊
        const answersArray = questionIds.map((_, index) => selectedans[index] || "");

        // 如果 timer 是 undefined，就給一個預設值 0
        const safeTimer = timer ?? -1;

        console.log("test:", currentUser, questionIds, answersArray, safeTimer);

        const response = await fetch('/api/SL/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creator_id: currentUser,
                question_number: questionIds,
                selected_answer: answersArray,
                duration: safeTimer
            })
        });

        const result = await response.json();
        console.log("保存結果:", result);

    } catch (error) {
        console.log("匯入失敗，請稍後再試。錯誤：" + error);
    }
}


// 跳題按鈕事件監聽
document.getElementById('next-question').addEventListener('click', function() {
    // 跳題功能
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    } else {
        alert('這已經是最後一題，無法跳題。');
        // 禁用跳題按鈕
        document.getElementById('next-question').disabled = true;
    }
});


// 監聽「結束測驗」按鈕的事件
document.getElementById('end-quiz').addEventListener('click', function () {
    if (completedQuestions.size === totalQuestions) {
        const isConfirmed = confirm("您已完成所有題目，確定要交卷嗎？");
        if (isConfirmed) {
            endQuiz();
        }
    } else {
        // 計算未完成的題號（index 從 0 開始）
        const incomplete = [];
        for (let i = 0; i < totalQuestions; i++) {
            if (!completedQuestions.has(i)) {
                incomplete.push(i + 1); // 顯示時 +1，符合人類習慣
            }
        }

        // 顯示提示訊息
        alert(`您尚未完成以下題號：${incomplete.join(", ")}，請完成後再提交！`);
    }
});



// 暫停計時器按鈕事件監聽
document.getElementById('pause-timer').addEventListener('click', function() {
    clearInterval(timerInterval);
    remainingTime = timer; // 更新 remainingTime 為當前計時器的值
    document.getElementById('pause-timer').style.display = 'none';
    document.getElementById('resume-timer').style.display = 'block';
});

// 繼續計時器按鈕事件監聽
document.getElementById('resume-timer').addEventListener('click', function() {
    startTimer(remainingTime); // 使用 remainingTime 重新啟動計時器
    document.getElementById('pause-timer').style.display = 'block';
    document.getElementById('resume-timer').style.display = 'none';
});

// 在 endQuiz 函數中修改 scoreContainer 內的 HTML 來顯示返回主畫面按鈕
async function endQuiz() {
    clearInterval(timerInterval); // 停止計時器
    let score = 0;
    let incorrectCount = 0;
    const totalQuestions = questions.length;

    let ans = [];

    try {
        const ansRes = await fetch('/api/questions/get_ans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: questionIds })
        });

        const ansData = await ansRes.json();
        console.log('Question Data:', ansData);

        if (!ansData.ans || ansData.ans.length === 0) {
            alert('題目資料載入失敗');
            return;
        }

        ans = ansData.ans;
    } catch (error) {
        console.error('題目載入時發生錯誤:', error);
        alert('載入題目時發生錯誤，請稍後再試');
        return;
    }

    // 比對使用者答案與正確答案
    questions.forEach((question, index) => {
        if (question.type !== "申論") {
            const selectedAnswer = question.selectedAnswer || null;
            const correctAnswer = ans[index]?.gh || null;

            if (selectedAnswer === correctAnswer) {
                score++;
            } else {
                incorrectCount++;
            }
        }
    });

    const scorePercentage = (score / totalQuestions) * 100;
    const scoreContainer = document.getElementById("score-container");
    scoreContainer.innerHTML = `測驗結束！<br>總分：${scorePercentage.toFixed(2)}%<br>錯誤題數：${incorrectCount}`;

    // 顯示答案對照表
    let answerListHtml = ` 
    <h3>答案對照表：</h3>
    <table border="1">
        <tr style="color: black;">
            <th>對/錯</th>
            <th>題號</th>
            <th>您的答案</th>
            <th>正確答案</th>
            <th>詳解</th>
        </tr>
    `;

    questions.forEach((question, index) => {
        let selectedAnswer;
        if (question.type === "申論") {
            selectedAnswer = question.answer || "未作答";
        } else {
            selectedAnswer = question.selectedAnswer || "未作答";
        }
        const correctAnswer = ans[index]?.gh || "無";
        const explanation = ans[index]?.explanation || "無詳解";
        const isCorrect = selectedAnswer === correctAnswer;
        let answerColor = isCorrect ? "blue" : "red";
        let result = isCorrect ? "O" : "X";

        answerListHtml += `
           <tr style="color: ${answerColor};">
                <td>${result}</td>
                <td>${index+1}</td>
                <td>${selectedAnswer}</td>
                <td>${correctAnswer}</td>
                <td>${explanation}</td>
            </tr>
        `;
    });

    answerListHtml += "</table>";
    scoreContainer.innerHTML += answerListHtml;

    // 顯示返回主畫面按鈕
    scoreContainer.innerHTML += `<br><button id="return-to-home" onclick="returnToHome()">返回主畫面</button>`;
    scoreContainer.style.display = "block"; // 顯示分數

    // 隱藏測驗相關元素
    document.getElementById("start-quiz").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.querySelector(".button-container").style.display = "none";

    // 儲存測驗結果失敗
    const exquestionNumber = questions.map(q => ({
        questionNumber: q.questionNumber
    }));

    const exselectedAnswer = questions.map(q => ({
        selectedAnswer: q.type === "申論"
            ? (q.answer ?? null)
            : (q.selectedAnswer ?? null)
    }));

    const quizResult = {
        username: currentUser,
        questionNumber: exquestionNumber,
        selectedAnswer: exselectedAnswer,
        date: new Date().toLocaleString()
    };

    fetch("/api/questions/save_quiz_result", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(quizResult),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("成功儲存測驗結果：", data);
        })
        .catch((error) => {
            console.error("儲存測驗結果失敗：", error);
        });
}

// 返回主畫面函數
function returnToHome() {
    // 隱藏測驗結束畫面
    document.getElementById('score-container').style.display = 'none';

    // 顯示主畫面
    document.getElementById('filter-search-container').style.display = 'block';
    document.getElementById('container').style.display = 'none'; // 隱藏測驗畫面

    // 重設所有變數與選項（如有需要）
    currentQuestionIndex = 0;
    selectedOption = null;
    score = 0;
    incorrectCount = 0;
    completedQuestions.clear(); // 清空已完成題目集合
    questions.length = 0; // 清空題目
    
    // 重新載入頁面
    location.reload();
}
// 綁定返回鏈接的點擊事件
document.getElementById('back-link').addEventListener('click', function(event) {
    event.preventDefault(); // 防止頁面跳轉
    returnToHome(); // 執行返回主畫面的函數
});

// 開始計時器
function startTimer(duration) {
    timer = duration; // 將 timer 變數設置為全域範圍
    let minutes, seconds;
    const timerContainer = document.getElementById('timer');
    timerContainer.style.display = 'block'; // 顯示計時器
    timerInterval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerContainer.innerHTML = `剩餘時間：${minutes}:${seconds}`;

        if (--timer < 0) {
            endQuiz();
        }
    }, 1000);
}

function parseYearRange(yearInput) {
    if (yearInput.includes('-')) {
        let [start, end] = yearInput.split('-').map(Number);
        return { start, end };
    }
    return { start: Number(yearInput), end: Number(yearInput) };
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
document.getElementById('time-limit-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'time-limit');
});
document.getElementById('question-count-input').addEventListener('keypress', function(event) {
    handleKeyPress(event, 'question-count');
});



// 新增題目表單提交事件監聽
document.getElementById('add-question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const year = parseInt(document.getElementById('year').value);
    const category = document.getElementById('category').value;
    const subject = document.getElementById('subject').value;
    const questionNumber = parseInt(document.getElementById('questionNumber').value);
    const question = document.getElementById('question').value;
    const options = document.getElementById('options').value.split(',');
    const answer = document.getElementById('answer').value;
    const type = document.getElementById('question-type').value; // 新增題型屬性

    const newQuestion = {
        year: year,
        category: category,
        subject: subject,
        questionNumber: questionNumber,
        question: question,
        options: options,
        answer: answer,
        marked: false, // 新增標記屬性
        markedSymbol: "", // 新增標記符號屬性
        answered: false, // 新增作答屬性
        type: type // 新增題型屬性
    };

    questions.push(newQuestion);
    alert('題目已新增！');
    document.getElementById('add-question-form').reset();
});

// 插入符號
function insertSymbol(symbol) {
    const answerBox = document.getElementById("written-answer");
    answerBox.focus();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(symbol);
    range.insertNode(textNode);

    // 游標移到符號後面
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
}

// 撤銷
function undo() {
    document.execCommand("undo", false, null);
}
function formatText(command) {
    const textarea = document.getElementById('written-answer');
    textarea.focus();

    switch (command) {
        case 'bold':
            document.execCommand('bold');
            break;
        case 'italic':
            document.execCommand('italic');
            break;
        case 'underline':
            document.execCommand('underline');
            break;
        case 'fontSize':
            const sizeOptions = ["1", "2", "3", "4", "5", "6", "7"];
            const size = prompt("請選擇字體大小（1-7）：", "3");
            if (sizeOptions.includes(size)) {
                document.execCommand('fontSize', false, size);
            } else {
                alert("無效的字體大小");
            }
            break;
        case 'fontFamily':
            const fontOptions = ["標楷體", "Times New Roman"];
            const font = prompt("請選擇字型：" + fontOptions.join(", "), "標楷體");
            if (fontOptions.includes(font)) {
                document.execCommand('fontName', false, font);
            } else {
                alert("無效的字型");
            }
            break;
        default:
            break;
    }
}


function undo() {
    document.execCommand('undo');
}

function showAllQuestions() {
    const allQuestionsContainer = document.getElementById('all-questions-container');
    allQuestionsContainer.style.display = 'block';
}



document.getElementById('add-question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    showQuestionList();
});

async function login(userId) {
    const response = await fetch(`/api/session/login/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    console.log(data.message); // 顯示登入訊息
}


// 更新使用者名稱
async function updateLoginButton() {
    let loginButton = document.getElementById("login-link");
    let registerButton = document.getElementById("register-link");
    let listButton = document.getElementById("main-account-link");
    let classButton = document.getElementById("class-link");
    let backlinkButton = document.getElementById("back-link");

    // 取得當前使用者 ID（確保等待 Promise 完成）
    let userID = await getCurrentUser();

    // 確保先移除舊的事件處理程序
    loginButton.removeEventListener("click", logoutFunction);

    if (userID) {
        loginButton.textContent = "登出";
        loginButton.addEventListener("click", logoutFunction);
        classButton.addEventListener("click", settingFunction);
        registerButton.textContent = userID;
        backlinkButton.textContent = userID;
    } else {
        loginButton.textContent = "登出";
        loginButton.addEventListener("click", logoutFunction);
        registerButton.textContent = "訪客";
        backlinkButton.textContent = "訪客";
    }
}


// 顯示彈出視窗
function showPopup(title, content) {
    document.getElementById("popup-window").style.display = "block";
    document.getElementById("popup-title").textContent = title;
    document.getElementById("popup-body").innerHTML = content;
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

// 初始化登入按鈕狀態
updateLoginButton();

// 關閉視窗
document.getElementById("close-popup").addEventListener("click", function() {
    document.getElementById("popup-window").style.display = "none";
});

// 歷史紀錄顯示功能
document.getElementById("book-link").addEventListener("click", async function () {
    if (!currentUser) {
        alert("請先登入查看歷史紀錄！");
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
        // 顯示在 questionList 區塊
        const questionList = document.getElementById("questionList");
        questionList.innerHTML = "";   // 清空
        questionList.innerHTML = historyHtml;

    } catch (error) {
        console.error("獲取歷史紀錄時發生錯誤：", error);
        alert("無法獲取歷史紀錄，請稍後再試！");
    }
});

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

document.getElementById('viewAllBtn').addEventListener('click', function () {
    const questionList = document.getElementById('questionList');
    const responseText = document.getElementById('response');

    // 切換顯示或隱藏題目區塊
    if (questionList.style.display === 'none' || questionList.style.display === '') {
        responseText.textContent = '正在載入題目...';
        questionList.style.display = 'block';

        fetch('/api/questions/view_all_questions/')
            .then(response => response.json())
            .then(data => {
                questionList.innerHTML = '';

                if (data.questions && data.questions.length === 0) {
                    questionList.innerHTML = '<p>目前沒有題目</p>';
                } else {
                    data.questions.forEach(question => {
                        const div = document.createElement('div');
                        div.classList.add('question-item');

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.classList.add('question-checkbox');
                        checkbox.value = question.id;

                        div.innerHTML = `
                            <strong>科目：</strong> ${question.subject || '無科目'}<br>
                            <strong>年度：</strong> ${question.year || '無年度'}<br>
                            <strong>類別：</strong> ${question.category || '無類別'}<br><br>
                        `;
                        div.prepend(checkbox);
                        div.innerHTML += `
                            <strong>ID:</strong> ${question.id}<br>
                            <strong>問題：</strong> ${question.question_text || '無題目'}<br>
                        `;

                        const optionsDiv = document.createElement('div');
                        optionsDiv.classList.add('answer-options');
                        optionsDiv.innerHTML = `
                            <span><strong>A:</strong> ${question.option_a || '無選項'}</span><br>
                            <span><strong>B:</strong> ${question.option_b || '無選項'}</span><br>
                            <span><strong>C:</strong> ${question.option_c || '無選項'}</span><br>
                            <span><strong>D:</strong> ${question.option_d || '無選項'}</span><br>
                        `;
                        div.appendChild(optionsDiv);
                        questionList.appendChild(div);
                    });
                }

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

// ===================== 生成考卷 ===================== 
document.getElementById('generatePractice').addEventListener('click', async function () {
    const button = this;
    const responseDiv = document.getElementById('response');
    responseDiv.textContent = '正在生成考卷，請稍候...';

    button.disabled = true;
    button.textContent = "生成中...";

    // 取得選中的題目 ID 列表
    const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
                                   .map(checkbox => parseInt(checkbox.value));

    if (selectedQuestions.length === 0) {
        responseDiv.textContent = '請先勾選至少一個題目！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    // 顯示提示視窗讓使用者輸入考試標題
    const examTitle = prompt('請輸入考試標題：');
    if (!examTitle || examTitle.trim() === "") {
        responseDiv.textContent = '請輸入有效的考試標題！';
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

    // 取得當前使用者 ID
    let currentUser = await getCurrentUser();
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
});

// ===================== 查看考卷 ===================== 
document.getElementById('viewPractice').addEventListener('click', async function () {
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

// ===================== 練習題目選擇 =====================
window.addEventListener('DOMContentLoaded', async () => {
  const practiceSelect = document.getElementById('practiceSelect');
  try {
    const res = await fetch('/api/practice/list'); // 你可先寫死 / 模擬資料
    const data = await res.json();
    const options = (data.questions || [])
      .map(q => `<option value="${q.id}">${q.title || `題目 ${q.id}`}</option>`)
      .join('');
    practiceSelect.innerHTML += options;
  } catch (error) {
    console.error('載入練習清單失敗', error);
    practiceSelect.innerHTML += '<option value="">無法載入</option>';
  }
});

document.getElementById('practiceSelect').addEventListener('change', async (e) => {
  const selectedId = e.target.value;
  if (!selectedId) return;

  try {
    const res = await fetch(`/api/practice/practice-question?question_id=${encodeURIComponent(selectedId)}`);
    const data = await res.json();
    const q = data.question;
    const html = `
      <div>
        <h3>題目：</h3>
        <p>${q.question_text}</p>
        <ul>
          <li>A: ${q.option_a}</li>
          <li>B: ${q.option_b}</li>
          <li>C: ${q.option_c}</li>
          <li>D: ${q.option_d}</li>
        </ul>
      </div>
    `;
    document.getElementById('question-container').innerHTML = html;
  } catch (error) {
    console.error('載入題目失敗', error);
    alert('載入失敗');
  }
});



document.getElementById('submitPractice').addEventListener('click', async function () {
  const button = this;
  button.disabled = true;
  button.textContent = "送出中...";

  const responseBox = document.getElementById('practiceResponse');
  responseBox.textContent = "正在送出練習紀錄，請稍候...";

  const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
    .map(q => parseInt(q.value));

  if (!selectedQuestions.length) {
    responseBox.textContent = "請勾選至少一題練習題目";
    button.disabled = false;
    button.textContent = "送出練習紀錄";
    return;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    responseBox.textContent = "請先登入！";
    button.disabled = false;
    button.textContent = "送出練習紀錄";
    return;
  }

  // 填入你需要的練習模式、來源等資料
  const mode = "normal";
  const source = "手動選題";
  const tag = "review";
  const now = new Date();
  now.setHours(now.getHours() + 8);
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

  // 將每題送出成一筆練習紀錄
  try {
    for (let qid of selectedQuestions) {
      await fetch('/api/practice/submit-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          question_id: qid,
          selected_answer: null,  // 可等使用者後續填答後補上
          is_correct: 0,
          mode,
          source,
          tag,
          timestamp
        })
      });
    }

    responseBox.textContent = "練習紀錄已成功送出！";
  } catch (error) {
    console.error("練習紀錄送出錯誤：", error);
    responseBox.textContent = "發生錯誤，請稍後再試";
  } finally {
    button.disabled = false;
    button.textContent = "送出練習紀錄";
  }
});

document.querySelectorAll('.answer-options button').forEach(btn => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.option;
    const isCorrect = (selected === correctAnswer) ? 1 : 0;
    // 再呼叫 submit-practice API 加入 selected_answer 與 is_correct
  });
});

// ===================== 練習題目選擇 =====================
window.addEventListener('DOMContentLoaded', async () => {
  const practiceSelect = document.getElementById('practiceSelect');
  try {
    const res = await fetch('/api/practice/list'); // 你可先寫死 / 模擬資料
    const data = await res.json();
    const options = (data.questions || [])
      .map(q => `<option value="${q.id}">${q.title || `題目 ${q.id}`}</option>`)
      .join('');
    practiceSelect.innerHTML += options;
  } catch (error) {
    console.error('載入練習清單失敗', error);
    practiceSelect.innerHTML += '<option value="">無法載入</option>';
  }
});

document.getElementById('generatePractice').addEventListener('click', () => {
  document.getElementById('submitPractice').click();
});

document.getElementById('practiceSelect').addEventListener('change', async (e) => {
  const selectedId = e.target.value;
  if (!selectedId) return;

  try {
    const res = await fetch(`/api/practice/practice-question?question_id=${encodeURIComponent(selectedId)}`);
    const data = await res.json();
    const q = data.question;

    // 自動新增勾選框到 questionList 區塊
    const container = document.getElementById('questionList');
    const div = document.createElement('div');
    div.classList.add('question-item');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('question-checkbox');
    checkbox.value = q.id;
    checkbox.checked = true;

    div.innerHTML = `
      <strong>科目：</strong> ${q.subject || '無'}<br>
      <strong>年度：</strong> ${q.year || '無'}<br>
      <strong>類別：</strong> ${q.category || '無'}<br><br>
      <strong>ID:</strong> ${q.id}<br>
      <strong>問題：</strong> ${q.question_text || '無題目'}<br>
      <strong>選項：</strong>
      <ul>
        <li>A: ${q.option_a}</li>
        <li>B: ${q.option_b}</li>
        <li>C: ${q.option_c}</li>
        <li>D: ${q.option_d}</li>
      </ul>
    `;
    div.prepend(checkbox);
    container.appendChild(div);
  } catch (error) {
    console.error('載入題目失敗', error);
    alert('無法載入練習題目');
  }
});



document.getElementById('submitPractice').addEventListener('click', async function () {
  const button = this;
  button.disabled = true;
  button.textContent = "送出中...";

  const responseBox = document.getElementById('practiceResponse');
  responseBox.textContent = "正在送出練習紀錄，請稍候...";

  const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
    .map(q => parseInt(q.value));

  if (!selectedQuestions.length) {
    responseBox.textContent = "請勾選至少一題練習題目";
    button.disabled = false;
    button.textContent = "送出練習紀錄";
    return;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    responseBox.textContent = "請先登入！";
    button.disabled = false;
    button.textContent = "送出練習紀錄";
    return;
  }

  // 填入你需要的練習模式、來源等資料
  const mode = "normal";
  const source = "手動選題";
  const tag = "review";
  const now = new Date();
  now.setHours(now.getHours() + 8);
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

  // 將每題送出成一筆練習紀錄
  try {
    for (let qid of selectedQuestions) {
      await fetch('/api/practice/submit-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          question_id: qid,
          selected_answer: null,  // 可等使用者後續填答後補上
          is_correct: 0,
          mode,
          source,
          tag,
          timestamp
        })
      });
    }

    responseBox.textContent = "練習紀錄已成功送出！";
  } catch (error) {
    console.error("練習紀錄送出錯誤：", error);
    responseBox.textContent = "發生錯誤，請稍後再試";
  } finally {
    button.disabled = false;
    button.textContent = "送出練習紀錄";
  }
});

document.querySelectorAll('.answer-options button').forEach(btn => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.option;
    const isCorrect = (selected === correctAnswer) ? 1 : 0;
    // 再呼叫 submit-practice API 加入 selected_answer 與 is_correct
  });
});

document.getElementById('viewPractice').addEventListener('click', async () => {
  const username = await getCurrentUser();
  const container = document.getElementById('practiceResultList');
  container.innerHTML = '';

  try {
    const res = await fetch('/api/practice/view-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const data = await res.json();

    (data.records || []).forEach(r => {
      container.innerHTML += `
        <div class="practice-item">
          <p><strong>題目 ID:</strong> ${r.question_id}</p>
          <p><strong>答案:</strong> ${r.selected_answer || '未作答'}</p>
          <p><strong>結果:</strong> ${r.is_correct ? '✅' : '❌'}</p>
          <p><strong>時間:</strong> ${r.timestamp}</p>
          <hr>
        </div>
      `;
    });
  } catch (error) {
    container.innerHTML = '<p>載入失敗，請稍後再試。</p>';
    console.error(error);
  }
});



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

// ===================== 生成考卷 ===================== 
document.getElementById('generatePractice').addEventListener('click', async function () {
    const button = this;
    const responseDiv = document.getElementById('response');
    responseDiv.textContent = '正在生成考卷，請稍候...';

    button.disabled = true;
    button.textContent = "生成中...";

    // 取得選中的題目 ID 列表
    const selectedQuestions = Array.from(document.querySelectorAll('.question-checkbox:checked'))
                                   .map(checkbox => parseInt(checkbox.value));

    if (selectedQuestions.length === 0) {
        responseDiv.textContent = '請先勾選至少一個題目！';
        button.disabled = false;
        button.textContent = "生成考卷";
        return;
    }

    // 顯示提示視窗讓使用者輸入考試標題
    const examTitle = prompt('請輸入考試標題：');
    if (!examTitle || examTitle.trim() === "") {
        responseDiv.textContent = '請輸入有效的考試標題！';
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

    // 取得當前使用者 ID
    let currentUser = await getCurrentUser();
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
});

// ===================== 查看考卷 ===================== 
document.getElementById('viewPractice').addEventListener('click', async function () {
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