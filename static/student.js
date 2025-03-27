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

// 取得當前使用者 ID
async function getCurrentUser() {
    const response = await fetch('/api/session/get_user/');
    if (response.ok) {
        const data = await response.json();
        return data.currentUserID;
    } else {
        console.log('未登入');
        return null;  // 確保函式有回傳值
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

        // 如果是進階模式，不顯示⭐，只顯示題號或答案
        return `<button onclick="jumpToQuestion(${index})" style="${buttonStyle}">
            ${isGeneralMode ? question.questionNumber : `${question.questionNumber}.`} 
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
document.addEventListener("DOMContentLoaded", fetchQuestions);
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
document.getElementById('filter-search-button').addEventListener('click', function() {
    const subject = document.getElementById('subject').value;
    const category = document.getElementById('category').value;
    const year = document.getElementById('year').value;
    const questionType = document.getElementById('question-type').value;
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    const questionCount = document.getElementById('question-count').value; // 保持為字串形式

    // 搜尋結果
    const searchResults = searchQuestions(subject, category, year, questionType, questionCount); // 增加 questionCount 參數
    
    if (searchResults.length > 0) {
        questions.length = 0; // 清空原有題目
        questions.push(...searchResults); // 添加搜尋結果
        document.getElementById('start-quiz').style.display = 'block'; // 顯示開始測驗按鈕
        document.getElementById('start-quiz').dataset.timeLimit = timeLimit; // 設置時間限制
    } else {
        alert('未找到符合條件的題目。');
    }
});


// 開始測驗按鈕事件監聽
document.getElementById('start-quiz').addEventListener('click', function() {
    document.getElementById("sidebar").style.display = "block";
    document.getElementById('start-quiz').style.display = 'none';
    document.getElementById('filter-search-container').style.display = 'none'; // 隱藏篩選搜尋選單
    document.getElementById('question-container').style.display = 'block';
    document.querySelector('.button-container').style.display = 'flex';
    const timeLimit = parseInt(this.dataset.timeLimit);
    if (timeLimit > 0) {
        startTimer(timeLimit);
    }
    showQuestion();
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
document.getElementById('end-quiz').addEventListener('click', function() {
    // 檢查用戶是否回答完所有問題
    if (completedQuestions.size === totalQuestions) {
        // 如果已經回答完所有題目，彈出確認框
        const isConfirmed = confirm("您已完成所有題目，確定要交卷嗎？");
        if (isConfirmed) {
            endQuiz();  // 如果用戶確定交卷，執行結束測驗操作
        }
    } else {
        alert("您尚未完成所有題目，請完成後再提交！");
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
function endQuiz() {
    clearInterval(timerInterval); // 停止計時器
    let score = 0;
    let incorrectCount = 0;

    // 遍歷所有問題，計算正確與錯誤的數量
    questions.forEach((question) => {
        if (question.type !== "申論") {
            const selectedAnswer = question.selectedAnswer;
            if (selectedAnswer === question.gh) {
                score++;
            } else {
                incorrectCount++;
            }
        }
    });

    const scorePercentage = (score / totalQuestions) * 100;
    const scoreContainer = document.getElementById('score-container');
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
        let answerColor = question.selectedAnswer === question.gh ? 'blue' : 'red';
        let result = question.selectedAnswer === question.gh ? 'O' : 'X';

        answerListHtml += `
           <tr style="color: ${answerColor};">
                <td>${result}</td>
                <td>${question.questionNumber}</td>
                <td>${question.selectedAnswer || '未作答'}</td>
                <td>${question.gh}</td>
                <td>${question.explanation || '無詳解'}</td>
            </tr>
        `;
    });
    answerListHtml += "</table>";

    scoreContainer.innerHTML += answerListHtml;

    // 顯示返回主畫面按鈕
    scoreContainer.innerHTML += `<br><button id="return-to-home" onclick="returnToHome()">返回主畫面</button>`;
    scoreContainer.style.display = 'block'; // 顯示分數

    // 隱藏測驗相關元素
    document.getElementById('start-quiz').style.display = 'none'; 
    document.getElementById('question-container').style.display = 'none';
    document.querySelector('.button-container').style.display = 'none';
        // 儲存測驗結果
        if (currentUser) {
            const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
            const quizResult = {
                username: currentUser,
                score: scorePercentage.toFixed(2),
                incorrectCount: incorrectCount,
                date: new Date().toLocaleString(),
                details: questions.map((question) => ({
                    questionNumber: question.questionNumber,
                    selectedAnswer: question.selectedAnswer,
                    correctAnswer: question.gh,
                    isCorrect: question.selectedAnswer === question.gh,
                    explanation: question.explanation || '無詳解',
                }))
            };
            history.push(quizResult);
            localStorage.setItem('quizHistory', JSON.stringify(history));
        }
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
//function searchQuestions(subject, category, year, questionType, questionCount) {
    //let filteredQuestions = questions.filter(question => {
        //return (
            //(subject === "全部" || !subject || question.subject === subject) &&
            //(category === "全部" || !category || question.category.includes(category)) &&
            //(year === "全部" || !year || question.year.toString() === year.toString()) &&
            //(questionType === "全部" || !questionType || question.type === questionType)
        //);
    //});

    // 題數處理
    //if (questionCount !== "全部" && questionCount !== "" && !isNaN(questionCount)) {
        //return filteredQuestions.slice(0, Number(questionCount));
   // }
    //return filteredQuestions;
//}


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
        filteredQuestions = filteredQuestions.slice(0, Number(questionCount));
    }

    // 單獨處理 category 為 "全部" 的情況
    if (category === "全部") {
        return filteredQuestions;
    } else {
        return filteredQuestions.filter(question => question.category === category);
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

let users = { "a": "123456" };

// 直接上傳使用者資料到 FastAPI
async function uploadUsers(users) {
    try {
        const userList = Object.entries(users).map(([username, password]) => ({ 
            username, 
            password, 
            identities: "學生"  // 預設身份為學生
        }));

        const response = await fetch("/api/save_users/save_users/", {  // 確保路徑正確，應以斜線結尾
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ users: userList })
        });

        if (response.ok) {
            console.log("使用者資料已成功上傳");
        } else {
            const errorText = await response.text();
            console.error("上傳失敗：", errorText);
        }
    } catch (error) {
        console.error("發生錯誤：", error);
    }
}

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


// 更新登入/登出按鈕
// 更新註冊按鈕/使用者名稱
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
        loginButton.textContent = "登出?";
        loginButton.addEventListener("click", logoutFunction);
        registerButton.textContent = "你是誰?";
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

    // 顯示該用戶的測驗歷史
    const quizHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
    const userHistory = quizHistory.filter(result => result.username === currentUser);

    if (userHistory.length === 0) {
        alert("您目前沒有測驗歷史紀錄！");
        return;
    }

    let historyHtml = `<h3>${currentUser} 的歷史紀錄：</h3>`;
    userHistory.forEach((result, index) => {
        historyHtml += `
        <div>
            <h4>測驗日期：${result.date}</h4>
            <p>總分：${result.score}%</p>
            <p>錯誤題數：${result.incorrectCount}</p>
            <button onclick="toggleDetails(${index})">顯示詳情</button>
            <div id="details-${index}" style="display:none;">
                <table border="1">
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
});

// 切換顯示/隱藏詳情的函數
function toggleDetails(index) {
    const detailsDiv = document.getElementById(`details-${index}`);
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
    } else {
        detailsDiv.style.display = "none";
    }
}
