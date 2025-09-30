// 取得 URL 裡的 ID，例如 /edit/123
const pathParts = window.location.pathname.split("/");
const questionId = pathParts[pathParts.length - 1];

// 載入題目資料
fetch(`/api/questions/view_questions/${questionId}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("subject").value = data.subject || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("category").value = data.category || "";
    document.getElementById("question_text").value = data.question_text || "";
    document.getElementById("option_a").value = data.option_a || "";
    document.getElementById("option_b").value = data.option_b || "";
    document.getElementById("option_c").value = data.option_c || "";
    document.getElementById("option_d").value = data.option_d || "";
    document.getElementById("correct_answer").value = data.correct_answer || "";
  })
  .catch(err => {
    console.error("載入失敗:", err);
    document.getElementById("message").textContent = "載入題目失敗";
    document.getElementById("message").style.color = "red";
  });

// 表單送出更新
document.getElementById("editForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const updatedData = {
    subject: document.getElementById("subject").value,
    year: document.getElementById("year").value,
    category: document.getElementById("category").value,
    question_text: document.getElementById("question_text").value,
    option_a: document.getElementById("option_a").value,
    option_b: document.getElementById("option_b").value,
    option_c: document.getElementById("option_c").value,
    option_d: document.getElementById("option_d").value,
    correct_answer: document.getElementById("correct_answer").value,
  };

  fetch(`/api/questions/update/${questionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  })
  .then(res => res.json())
  .then(data => {
    // 顯示訊息
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "更新成功！";
    messageDiv.style.color = "green";

    // 🔹 自動觸發父頁面按鈕
    if (window.parent) {
      const btn = window.parent.document.getElementById('viewAllBtn');
      if (btn) btn.click();  // 模擬點擊按鈕刷新題目列表
    }

    // 可選：自動關閉 modal iframe
    setTimeout(() => {
        if (window.parent) {
            const modal = window.parent.document.getElementById("editModal");
            if (modal) modal.style.display = "none";
        }
        }, 1500);

  })
  .catch(err => {
    console.error("更新失敗:", err);
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "更新失敗";
    messageDiv.style.color = "red";
  });
});