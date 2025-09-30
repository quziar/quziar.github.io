async function getCurrentUser() {
  try {
    const response = await fetch("/api/session/get_user/");
    if (response.ok) {
      const data = await response.json();
      return data.currentUserID;
    } else {
      console.log("未登入");
      return null;
    }
  } catch (err) {
    console.error("取得使用者失敗：", err);
    return null;
  }
}

let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
  // 取得當前使用者
  currentUser = await getCurrentUser();

  if (currentUser) {
    let logo = document.getElementById("logo");
    if (logo) logo.textContent = currentUser;
  }
});


// 切換「班級資訊」與「密碼管理」的分頁
document.getElementById("tab-class").addEventListener("click", () => {
  switchPanel("class");
});
document.getElementById("tab-pass").addEventListener("click", () => {
  switchPanel("pass");
});

// 切換面板的共用函式
function switchPanel(target) {
  // 先隱藏所有面板
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  // 移除所有 tab 的 active 樣式
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  // 顯示對應面板 + 設定 active 樣式
  document.getElementById(`panel-${target}`).classList.remove("hidden");
  document.getElementById(`tab-${target}`).classList.add("active");
}

/* -------------------------------
   班級資訊區塊
--------------------------------*/

// 本地暫存用（模擬資料庫）
let classData = {
  className: "",
  teacher: ""
};

// 儲存按鈕
document.getElementById("save-class").addEventListener("click", () => {
  const className = document.getElementById("class-name").value.trim();
  const teacher = document.getElementById("teacher").value.trim();

  if (!className) {
    showMessage("class-msg", "請輸入班級名稱", false);
    return;
  }

  // 更新本地資料
  classData = { className, teacher };

  // 顯示成功訊息
  showMessage("class-msg", "班級資料已儲存 ✅", true);

  // 更新快速檢視
  renderClassView();
});

// 重設按鈕
document.getElementById("reset-class").addEventListener("click", () => {
  document.getElementById("class-name").value = "";
  document.getElementById("teacher").value = "";
  showMessage("class-msg", "欄位已清空", true);
});

// 重新整理快速檢視
document.getElementById("refresh-view").addEventListener("click", () => {
  renderClassView();
});

// 更新快速檢視面板
function renderClassView() {
  const view = document.getElementById("class-view");
  if (!classData.className && !classData.teacher) {
    view.textContent = "-- 尚無資料 --";
    return;
  }
  view.textContent = `班級名稱: ${classData.className || "(未填)"}\n導師: ${classData.teacher || "(未填)"}`;
}

/* -------------------------------
   密碼管理區塊
--------------------------------*/

// 變更密碼
document.getElementById("change-pass").addEventListener("click", async () => {
  if (!currentUser) {
    showMessage("pass-msg", "尚未登入，無法修改密碼", false);
    return;
  }

  const current = document.getElementById("current-pass").value;
  const newPass = document.getElementById("new-pass").value;
  const confirm = document.getElementById("confirm-pass").value;

  // 新密碼檢查
  if (newPass.length < 6) {
    showMessage("pass-msg", "新密碼至少需 6 個字元", false);
    return;
  }
  if (newPass !== confirm) {
    showMessage("pass-msg", "兩次輸入的新密碼不一致", false);
    return;
  }

  try {
    // 1. 驗證舊密碼
    const loginResp = await fetch("/api/save_users/userlogin/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, password: current })
    });

    if (!loginResp.ok) {
      const errData = await loginResp.json();
      showMessage("pass-msg","密碼錯誤 ❌", false);
      return;
    }

    // 2. 呼叫更新密碼 API
    const updateResp = await fetch("/api/save_users/update_password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, password: newPass })
    });

    if (updateResp.ok) {
      showMessage("pass-msg", "密碼已更新 ✅", true);
      // 清空輸入欄位
      document.getElementById("current-pass").value = "";
      document.getElementById("new-pass").value = "";
      document.getElementById("confirm-pass").value = "";
    } else {
      const errData = await updateResp.json();
      showMessage("pass-msg", errData.detail || "密碼更新失敗 ❌", false);
    }
  } catch (error) {
    console.error("變更密碼過程中出錯：", error);
    showMessage("pass-msg", "發生錯誤，請稍後再試！", false);
  }
});

/* -------------------------------
   共用訊息顯示
--------------------------------*/
function showMessage(id, text, success = true) {
  const msgEl = document.getElementById(id);
  msgEl.textContent = text;
  msgEl.classList.remove("hidden");
  msgEl.style.color = success ? "green" : "red";

  // 3 秒後自動隱藏
  setTimeout(() => {
    msgEl.classList.add("hidden");
  }, 3000);
}
