let questions = [];
let questionIds = [];

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
    window.location.replace(`/s/c`);
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

document.getElementById('add-question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    showQuestionList();
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
    document.getElementById("question-container").style.display = "none";

    // 顯示主畫面
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

/* 未做完測試
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
*/

document.addEventListener('DOMContentLoaded', function() {

    document.getElementById("sidebar").style.display = "none";

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
            window.location.replace(`/`);
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