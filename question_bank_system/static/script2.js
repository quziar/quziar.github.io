// 當點擊查看所有題目按鈕時，發送 GET 請求
document.getElementById('viewAllBtn').addEventListener('click', function() {
    // 顯示載入中的提示
    document.getElementById('response').textContent = '正在載入題目...';

    fetch('/api/questions/view_all_questions/')  // 注意：這裡需要與 FastAPI 路由一致
        .then(response => response.json())
        .then(data => {
            // 清空現有的問題列表
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';  // 清空現有題目

            if (data.questions && data.questions.length === 0) {
                questionList.innerHTML = '<p>目前沒有題目</p>';
            } else {
                // 顯示從後端獲取的題目
                data.questions.forEach(question => {
                    const div = document.createElement('div');
                    div.classList.add('question-item');

                    // 顯示題目的 ID
                    div.innerHTML = `<strong>ID:</strong> ${question.id}<br><strong>問題：</strong> ${question.question_text || '無題目'}<br>`;

                    // 顯示選項
                    const optionsDiv = document.createElement('div');
                    optionsDiv.classList.add('answer-options');
                    optionsDiv.innerHTML = `
                        <span><strong>A:</strong> ${question.option_a || '無選項'}</span>
                        <span><strong>B:</strong> ${question.option_b || '無選項'}</span>
                        <span><strong>C:</strong> ${question.option_c || '無選項'}</span>
                        <span><strong>D:</strong> ${question.option_d || '無選項'}</span>
                    `;
                    div.appendChild(optionsDiv);

                    // 顯示正確答案
                    div.innerHTML += `<strong>解答：</strong> ${question.correct_answer || '無解答'}`;

                    questionList.appendChild(div);
                });
            }
            document.getElementById('response').textContent = '';  // 清除載入提示
        })
        .catch(error => {
            document.getElementById('response').textContent = '無法載入題目，請稍後再試。';
        });
});






// 匯入題目
document.getElementById("importBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("/import-questions/", {
            method: "POST",
        });

        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert("Error: " + error);
    }
});

// 清空題目
document.getElementById("clearBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("/clear-all-questions/", {
            method: "POST",
        });

        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert("Error: " + error);
    }
});

// 整理重複題目
document.getElementById("cleanDuplicatesBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("/clean-duplicate-questions/", {
            method: "POST",
        });

        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert("Error: " + error);
    }
});