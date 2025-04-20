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

document.getElementById("eliminate-option").addEventListener("click", function() {
    const eliminateContainer = document.getElementById('eliminate-container');
    // 切換顯示狀態
    eliminateContainer.style.display = eliminateContainer.style.display === "none" ? "block" : "none";
});

document.querySelectorAll(".eliminate-option").forEach(button => {
    button.addEventListener("click", function() {
        const optionToEliminate = this.getAttribute("data-option");
        const question = questions[currentQuestionIndex];
        const optionIndex = ["A", "B", "C", "D"].indexOf(optionToEliminate); // 找到對應選項的索引

        // 切換選項刪除狀態
        if (question.eliminatedOptions.includes(optionIndex)) {
            question.eliminatedOptions = question.eliminatedOptions.filter(index => index !== optionIndex); // 移除刪除
        } else {
            question.eliminatedOptions.push(optionIndex); // 添加到刪除選項
        }

        showQuestion(); // 更新顯示題目
    });
});

function showQuestionList() {
    totalQuestions = questions.length;
    const questionListContainer = document.getElementById('question-list');
    const selectElement = document.getElementById("question-type-select");
    // 判斷是否為一般模式
    const isGeneralMode = selectElement.value === "general";

    questionListContainer.innerHTML = questions.map((question, index) => {
        // 檢查是否有標記⭐
        const isMarked = question.marked;
        // 檢查是否已回答（僅限一般模式）
        const isAnswered = isGeneralMode && question.answered;

        // 初始化按鈕樣式
        let buttonStyle = "";

        // 只有在一般模式下才會改變顏色
        if (isGeneralMode) {
            if (isMarked) {
                buttonStyle = "background-color: yellow; color: white; border: 2px solid yellow;";
            } else if (isAnswered) {
                buttonStyle = "background-color: blue; color: white; border: 2px solid blue;";
            }
        }
        // 題號顯示為連續數字（從 1 開始）
        const displayNumber = index + 1;
        // 如果是進階模式，不顯示⭐，只顯示題號或答案
        return `<button onclick="jumpToQuestion(${index})" style="${buttonStyle}">
            ${isGeneralMode ? displayNumber : `${displayNumber}.`} 
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
    showQuestion(); // 顯示該題
}

function showQuestion() {
    const questionContainer = document.getElementById('question-container');
    const question = questions[currentQuestionIndex];
    const optionLabels = ["A", "B", "C", "D"];

    // 顯示題號列表
    showQuestionList();

    // 處理下一題按鈕
    const nextButton = document.getElementById('next-question');
    nextButton.disabled = (currentQuestionIndex === questions.length - 1);

 // 顯示當前題目
 questionContainer.innerHTML = `
 <div class="question-header">${question.year} ${question.category} ${question.marked ? '⭐' : ''}</div>
 <h2>${question.questionNumber}. ${question.question}</h2>
 <div class="option-container">
     ${
         question.type === "申論"
         ? `<div id="toolbar">
             <button onclick="formatText('bold')"><b>B</b></button>
             <button onclick="formatText('italic')"><i>I</i></button>
             <button onclick="formatText('underline')"><u>U</u></button>
             <button onclick="formatText('fontSize')">A</button>
             <button onclick="formatText('fontFamily')">F</button>
             <button onclick="undo()">↺</button>
         </div>
         <div contenteditable="true" id="written-answer" class="lined-textarea" rows="10" cols="70" placeholder="請在此輸入答案...">${question.answer || ''}</div>`
         : question.options.map((option, index) => `
             <button class="option ${question.selectedAnswer === optionLabels[index] ? 'selected' : ''} ${question.eliminatedOptions?.includes(index) ? 'eliminated' : ''}" 
                 style="text-decoration: ${question.eliminatedOptions?.includes(index) ? 'line-through' : 'none'};" 
                 data-index="${index}">
                 <span style="color: black;">${optionLabels[index]}</span>. ${option}
             </button>
         `).join('')
     }
 </div>
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
            showQuestion();
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
      (d.exams || []).map(e => `<option value="${e.id}">${e.title}</option>`).join(''))
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
    showQuestion();
    
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

        const data = await examRes.json();
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
        showQuestion();
    } catch (error) {
        console.error('題目載入時發生錯誤:', error);
        alert('載入題目時發生錯誤，請稍後再試');
    }
});


function selectAnswer(questionIndex, answer) {
    questions[questionIndex].selectedAnswer = answer;
    // 不再在這裡標記已完成，因為標記完成的邏輯應該放在點擊「送出」後處理
}



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
        completedQuestions.add(currentQuestionIndex); // 將當前題目標記為已完成
    }

    // 移動到下一題
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion(); // 顯示下一題
    } else {
        alert("所有題目已完成！"); // 提示用戶所有題目已完成
    }
});



// 跳題按鈕事件監聽
document.getElementById('next-question').addEventListener('click', function() {
    // 跳題功能
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
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
        const selectedAnswer = question.selectedAnswer || "未作答";
        const correctAnswer = ans[index]?.gh || "無";
        const explanation = ans[index]?.explanation || "無詳解";
        const isCorrect = selectedAnswer === correctAnswer;
        let answerColor = isCorrect ? "blue" : "red";
        let result = isCorrect ? "O" : "X";

        answerListHtml += `
           <tr style="color: ${answerColor};">
                <td>${result}</td>
                <td>${question.questionNumber}</td>
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

    // 儲存測驗結果
    const quizResult = {
        username: currentUser,
        score: parseFloat(scorePercentage.toFixed(2)), // 確保是 float
        incorrectCount: incorrectCount,
        date: new Date().toLocaleString(),
        details: questions.map((question, index) => ({
            questionNumber: question.questionNumber,
            selectedAnswer: question.selectedAnswer || null,
            correctAnswer: ans[index]?.gh || "無",
            isCorrect: (question.selectedAnswer || null) === (ans[index]?.gh || "無"),
            explanation: ans[index]?.explanation || "無詳解",
        })),
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



function jumpToQuestion(index) {
    currentQuestionIndex = index;
    showQuestion();
}

function showAllQuestions() {
    const allQuestionsContainer = document.getElementById('all-questions-container');
    allQuestionsContainer.style.display = 'block';
}



document.getElementById('add-question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    showQuestionList();
});



//<option value="111">111</option>
//<option value="110">110</option>
//<option value="109">109</option>
//<option value="108">108</option>
//<option value="107">107</option>
//<option value="106">106</option>
//<option value="105">105</option>
//<option value="104">104</option>
//<option value="103">103</option>
//<option value="102">102</option>
//<option value="101">101</option>
//<option value="100">100</option>
//<option value="99">99</option>
//<option value="98">98</option>
//<option value="97">97</option>
//<option value="96">96</option>
//<option value="95">95</option>
//<option value="94">94</option>
//<option value="93">93</option>
//<option value="92">92</option>
//<option value="91">91</option>
//<option value="90">90</option>
//<option value="初考">初考</option>
//<option value="身心三等">身心三等</option>
//<option value="身心四等">身心四等</option>
//<option value="身心五等">身心五等</option>
//<option value="警特三等">警特三等</option>
///<option value="警特四等">警特四等</option>
//<option value="國安三等">國安三等</option>
//<option value="國安四等">國安四等</option>
//<option value="國安五等">國安五等</option>/
//<option value="退除役三等">退除役三等</option>
//<option value="退除役四等">退除役四等</option>
//<option value="高考二級">高考二級</option>
//<option value="高考三級">高考三級</option>
//<option value="調查五等">調查五等</option>
//<option value="原民三等">原民三等</option>
//<option value="原民四等">原民四等</option>
//<option value="原民五等">原民五等</option>
//<option value="外交三等">外交三等</option>
//<option value="外交四等">外交四等</option>
//<option value="地特三等">地特三等</option>
//<option value="地特四等">地特四等</option>
//<option value="地特五等">地特五等</option>
// 檢查是否已經有存儲的用戶資料，沒有則初始化
// 取得 localStorage 的用戶資料，確保是物件

// 儲存ID
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

    // 取得當前使用者 ID（確保等待 Promise 完成）
    let userID = await getCurrentUser();

    // 確保先移除舊的事件處理程序
    loginButton.removeEventListener("click", logoutFunction);

    if (userID) {
        loginButton.textContent = "登出";
        loginButton.addEventListener("click", logoutFunction);
        registerButton.textContent = userID;  // 顯示當前使用者名稱
    } else {
        loginButton.textContent = "登出";
        loginButton.addEventListener("click", logoutFunction);
        registerButton.textContent = "訪客";
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
document.getElementById("book-link").addEventListener("click", function() {
    if (!currentUser) {
        alert("請先登入查看歷史紀錄！");
        return;
    }

    fetch(`/api/questions/get_quiz_history/${currentUser}`)
        .then(response => response.json())
        .then(data => {
            if (data.history.length === 0) {
                alert("您目前沒有測驗歷史紀錄！");
                return;
            }

            let historyHtml = `<h3>${currentUser} 的歷史紀錄：</h3>`;
            data.history.forEach((result, index) => {
                historyHtml += `
                <div>
                    <h4>測驗日期：${result.date}</h4>
                    <p>總分：${result.score}%</p>
                    <p>錯誤題數：${result.incorrectCount}</p>
                    <button onclick="toggleDetails(${index})">顯示詳情</button>
                    <button onclick="exportToPDF(${index}, '${result.date}', ${result.score}, ${result.incorrectCount})">匯出 PDF</button>
                    <div id="details-${index}" style="display:none;">
                        <table border="1" id="table-${index}">
                            <tr style="color: black;">
                                <th>題號</th>
                                <th>您的答案</th>
                                <th>正確答案</th>
                                <th>詳解</th>
                            </tr>
                `;

                result.details.forEach((detail) => {
                    historyHtml += `
                    <tr>
                        <td>${detail.questionNumber}</td>
                        <td>${detail.selectedAnswer || '未作答'}</td>
                        <td>${detail.correctAnswer}</td>
                        <td>${detail.explanation}</td>
                    </tr>
                    `;
                });

                historyHtml += `</table><br></div></div>`;
            });

            document.getElementById("popup-window").style.display = "block";
            document.getElementById("popup-title").textContent = "歷史紀錄";
            document.getElementById("popup-body").innerHTML = historyHtml;
        })
        .catch(error => {
            console.error("獲取歷史紀錄時發生錯誤：", error);
            alert("無法獲取歷史紀錄，請稍後再試！");
        });
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

    // 設定中文字體
    doc.addFileToVFS("NotoSansTC-Regular.ttf", base64Font);
    doc.addFont("NotoSansTC-Regular.ttf", "NotoTC", "normal");
    doc.setFont("NotoTC");

    // 設定標題與測驗資訊
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102); // 深藍色標題
    doc.text("測驗歷史紀錄", 10, 15);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // 內容使用黑色
    doc.text(`📅 測驗日期：${date}`, 10, 25);
    doc.text(`✅ 總分：${score}%`, 10, 35);
    doc.text(`❌ 錯誤題數：${incorrectCount}`, 10, 45);

    // **手動擷取表格內容**
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
            rowData.push(cell.innerText.trim()); // 取出文字內容
        });

        if (rowIndex === 0) {
            tableData.unshift(rowData); // 第一列作為標題
        } else {
            tableData.push(rowData);
        }
    });

    // 使用 autoTable 匯出表格
    doc.autoTable({
        startY: 55,
        head: [tableData[0]], // 第一列作為標題
        body: tableData.slice(1), // 其他列作為表格內容
        headStyles: {
            fillColor: [0, 51, 102], // 標題背景：深藍色
            textColor: [255, 255, 255], // 標題文字：白色
            fontStyle: "bold",
        },
        bodyStyles: {
            textColor: [0, 0, 0], // 內容文字：黑色
        },
        alternateRowStyles: {
            fillColor: [230, 230, 230], // 交錯背景：淺灰色
        },
        styles: { font: "NotoTC" }
    });

    // 下載 PDF
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
