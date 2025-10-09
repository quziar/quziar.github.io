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

  // 監聽班級面板顯示時更新內容
  const panel = document.getElementById("panel-class");
  if (panel) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          if (!panel.classList.contains("hidden")) {
            updateClassView();
          }
        }
      });
    });
    observer.observe(panel, { attributes: true });
  }

  updateClassView();
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

//返回鍵
document.getElementById("back-btn").addEventListener("click", () => {
  window.location.replace(`/t`);
});

/* -------------------------------
   班級資訊區塊
--------------------------------*/

// 更新班級清單
async function updateClassView() {
  const classView = document.getElementById("class-view");
  if (!classView) return;

  classView.textContent = "載入中...";

  try {
    const response = await fetch(`/api/save_users/get_class/?username=${encodeURIComponent(currentUser)}`);
    if (response.ok) {
      const data = await response.json();
      console.log(data);

      const { class: classList } = data; // 避免直接用 class

      // 清空顯示區域
      classView.textContent = "";

      if (Array.isArray(classList) && classList.length > 0) {
        classList.forEach(cls => {
          const wrapper = document.createElement("div");
          wrapper.className = "class-item"; // 給 CSS 樣式用

          // 班級名稱
          const nameEl = document.createElement("span");
          nameEl.textContent = cls;
          nameEl.className = "class-name";

          // 班級資訊按鈕
          const infoBtn = document.createElement("button");
          infoBtn.textContent = "班級資訊";
          infoBtn.className = "class-info-btn";
          infoBtn.addEventListener("click", () => {
            const className = nameEl.textContent;
            window.location.replace(`/t/c/${encodeURIComponent(className)}`);
          });

          wrapper.appendChild(nameEl);
          wrapper.appendChild(infoBtn);

          classView.appendChild(wrapper);
        });
      } else {
        classView.textContent = "-- 尚無資料 --";
      }
    } else {
      console.error("無法取得班級資訊:", response.status);
      classView.textContent = "⚠️ 無法取得班級資訊";
    }
  } catch (err) {
    console.error("取得班級資訊發生錯誤:", err);
    classView.textContent = "⚠️ 伺服器錯誤";
  }
}

// 切換至新增班級畫面
document.getElementById("add-class-btn").addEventListener("click", () => {
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));

  document.getElementById("panel-class-creat").classList.remove("hidden");

  // 確保 tab 狀態正確
  document.getElementById("tab-class").classList.add("active");
  document.getElementById("tab-pass").classList.remove("active");
});

// 新增班級
document.getElementById("create-class-btn").addEventListener("click", async () => {
  const classInput = document.getElementById("new-class-name");
  const newClass = classInput.value.trim();

  if (!newClass) {
    alert("請輸入班級名稱！");
    return;
  }

  try {
    const response = await fetch("/api/save_users/create_class/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: currentUser,
        class_name: newClass
      }),
    });

    if (response.ok) {
      alert("班級創建成功！");
      switchPanel("class");
      updateClassView(); // ✅ 創建後刷新列表
    } else {
      const data = await response.json();
      let msg = data.detail || response.statusText;
      // 移除前綴
      msg = msg.replace(/^伺服器錯誤: 400: /, "");
      alert("創建班級失敗：" + msg);
    }
  } catch (err) {
    console.error("創建班級錯誤：", err);
    alert("創建班級發生錯誤，請檢查控制台");
  }
});

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
      showMessage("pass-msg", "密碼錯誤 ❌", false);
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

  // 5 秒後自動隱藏
  setTimeout(() => {
    msgEl.classList.add("hidden");
  }, 5000);
}
