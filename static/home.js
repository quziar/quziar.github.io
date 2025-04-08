// 顯示 session 資料
function showSessionData() {
  fetch("http://localhost:8000/show_session/")
    .then(response => response.json())  // 解析 JSON 回應
    .then(data => {
      console.log("Session Data:", data);  // 在控制台中顯示 session 資料
    })
    .catch(error => {
      console.error("Error:", error);  // 捕捉錯誤並顯示錯誤訊息
    });
}

// 儲存ID
async function login(userId) {
    const response = await fetch(`/api/session/login/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 保證攜帶 cookies
    });
    if (response.ok) {
        const data = await response.json();
        console.log(data.message); // 顯示登入訊息
    } else {
        console.error("登入失敗！");
    }
}

// 登入
document.getElementById("loginBtn").addEventListener("click", async function() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    // 檢查是否有空值
    if (!username || !password) {
        alert("帳號與密碼不能為空");
        return;
    }

    try {
        // 向 FastAPI 發送登入請求
        const response = await fetch("/api/save_users/userlogin/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username, password: password })
        });

        if (response.ok) {
            const data = await response.json(); // 從後端獲取 JSON 資料
            showSessionData();

            // 使用 switch 語句進行身份判斷
            switch (data.identities) {
                case "管理員":
                    login(username);
                    window.location.replace("/static/admin_dashboard.html");
                    break;
                case "教授":
                    login(username);
                    window.location.replace("/static/teacher.html");
                    break;
                case "學生":
                    login(username);
                    window.location.replace("/static/student.html");
                    break;
                default:
                    alert("身份不明，請聯繫系統管理員！");
                    console.error("未知身份:", data.identities);
            }
        } else {
            const errorData = await response.json();
            alert(errorData.detail || "登入失敗");
        }
    } catch (error) {
        alert("發生錯誤，請稍後再試！");
        console.error("登入過程中出錯：", error);
    }
});
