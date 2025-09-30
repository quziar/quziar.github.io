// ====================== 選擇按鈕功能 ======================
function choose(option) {
    alert("您選擇了：" + option);

    if (option === "考試") {
        window.location.href = '/static/exam.html';
    } else if (option === "自主練習") {
        window.location.href = '/static/practice.html';
    } else {
        window.location.href = '/static/home.html'; // 預設 fallback
    }
}


// ====================== 取得當前使用者 ID ======================
async function getCurrentUser() {
    try {
        const response = await fetch('/api/session/get_user/', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            return data.currentUserID;
        } else {
            console.log('未登入');
            return null;
        }
    } catch (error) {
        console.error('檢查登入錯誤:', error);
        return null;
    }
}

// ====================== 歷史紀錄載入 ======================
document.getElementById('history-link').addEventListener('click', async (e) => {
    e.preventDefault(); // 阻止預設跳轉

    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert("請先登入查看歷史紀錄！");
        return;
    }

    try {
        const response = await fetch(`/api/questions/get_quiz_history/${currentUser}`);
        if (!response.ok) throw new Error("無法從伺服器獲取歷史紀錄");

        const resultData = await response.json();
        if (!resultData.history || resultData.history.length === 0) {
            alert("您目前沒有測驗歷史紀錄！");
            return;
        }

        const history = resultData.history;
        let historyHtml = `
            <div class="history-card">
                <h3>${currentUser} 的歷史紀錄：</h3>
        `;

        for (const [index, result] of history.entries()) {
            let score = 0;
            let incorrectCount = 0;

            const questionIds = result.question_number.map(q => q.questionNumber);
            const selectedAnswers = result.selected_answer.map(a => a.selectedAnswer);
            const totalQuestions = questionIds.length;

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
                if (selectedAnswer === correctAnswer) score++;
                else incorrectCount++;
            });

            const scorePercentage = ((score / totalQuestions) * 100).toFixed(2);

            // 組合 HTML
            historyHtml += `
                <div class="history-item">
                    <h4>測驗日期：${result.date}</h4>
                    <p>總分：${scorePercentage}%</p>
                    <p>錯誤題數：${incorrectCount}</p>
                    <button class="btn btn-blue" onclick="toggleDetails(${index})">顯示詳情</button>
                    <button class="btn btn-blue" onclick="exportToPDF(${index}, '${result.date}', ${score}, ${incorrectCount})">匯出 PDF</button>
                    <div id="details-${index}" style="display:none;">
                        <table id="table-${index}" class="history-table">
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
                        <td>${i + 1}</td>
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

        historyHtml += `</div>`; // 關閉大卡片
        document.getElementById("questionList").innerHTML = historyHtml;

    } catch (error) {
        console.error("獲取歷史紀錄時發生錯誤：", error);
        alert("無法獲取歷史紀錄，請稍後再試！");
    }
});

// ====================== PDF 匯出 ======================
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

// ====================== DOM 初始化 ======================
document.addEventListener("DOMContentLoaded", async () => {
    const backLink = document.getElementById("back-link");
    const mainAccountLink = document.getElementById("main-account-link");
    const dropdown = document.getElementById("account-dropdown");
    const registerLink = document.getElementById("register-link"); // ⭐ 新增

    // 1. 更新 back-link 與 register-link 顯示
    const currentUser = await getCurrentUser();
    if (currentUser) {
        backLink.textContent = currentUser;
        backLink.href = `/user/${currentUser}`;

        // ⭐ 把 register-link 變成帳號名稱
        registerLink.textContent = currentUser;
        registerLink.href = `/user/${currentUser}`;
    } else {
        backLink.textContent = "返回";
        backLink.href = "#";

        // ⭐ 還原 register-link
        registerLink.textContent = "註冊";
        registerLink.href = "/static/register.html";
    }

    // 2. back-link 點擊
    backLink.addEventListener("click", (e) => {
        e.preventDefault();
        returnToHome();
    });

    // 3. 下拉選單切換
    mainAccountLink.addEventListener("click", (e) => {
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    // 4. 點擊外部關閉下拉
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".account-menu")) {
            dropdown.style.display = "none";
        }
    });
});

// ====================== 顯示詳情切換 ======================
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    if (!details) return;
    details.style.display = details.style.display === "block" ? "none" : "block";
}


document.getElementById("class-link").addEventListener("click", function(event) {
    event.preventDefault(); // 阻止 # 預設跳轉
    window.location.href = "/static/profiles.html";
});

// ====================== login-link 點擊 ======================
document.getElementById("login-link").addEventListener("click", async function(event) {
    event.preventDefault(); // 阻止預設 # 跳轉

    const currentUser = await getCurrentUser();

    if (currentUser) {
        // 已登入 → 顯示登出並跳到 home
        const loginLink = document.getElementById("login-link");
        loginLink.textContent = "登出";

        // 這裡你可以同時呼叫登出 API，讓 session 清掉
        // await fetch('/api/session/logout/', { method: 'POST', credentials: 'include' });

        window.location.href = "/static/home.html";
    } else {
        // 未登入 → 去登入頁面
        window.location.href = "/static/home.html";
    }
});

let clickCount = 0;
let timer;

document.getElementById('secretBtn').addEventListener('click', () => {
  clickCount++;

  // 2 秒內沒繼續點就重置
  clearTimeout(timer);
  timer = setTimeout(() => {
    clickCount = 0;
  }, 2000);

  if (clickCount === 5) {
    clickCount = 0;
    window.location.href = '/static/g1.html'; // ←換成你要的動作
  }
});