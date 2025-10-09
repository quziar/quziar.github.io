const studentList = document.getElementById("studentList");
const examList = document.getElementById("examList");

let students = [];
let exams = [];

// 取得班級名稱
function getClassName() {
  const pathParts = window.location.pathname.split("/");
  return decodeURIComponent(pathParts[pathParts.length - 1]);
}

// 渲染學生列表
async function renderStudents() {
  const className = getClassName(); // 取得目前班級名稱

  try {
    const response = await fetch('/api/save_users/view_all_users/');
    const data = await response.json();

    console.log("get data:", data);

    // 過濾符合條件的學生
    students = (data.users || [])
      .filter(u => u.identities === "學生" && u.class && u.class.includes(className))
      .map(u => u.username);

    const studentList = document.getElementById("studentList");
    studentList.innerHTML = "";

    // 渲染學生列表
    students.forEach((student, index) => {
      const li = document.createElement("li");
      li.classList.add("list-item");

      const span = document.createElement("span");
      span.textContent = student;
      li.appendChild(span);

      const removeBtn = document.createElement("button");
      removeBtn.classList.add("remove-btn");
      removeBtn.innerHTML = "✕";
      removeBtn.title = "移除學生";
      removeBtn.addEventListener("click", () => removeStudent(student));
      li.appendChild(removeBtn);

      studentList.appendChild(li);
    });

  } catch (err) {
    console.error("抓取學生資料失敗：", err);
    const studentList = document.getElementById("studentList");
    studentList.innerHTML = "<li>無法載入學生資料</li>";
  }
}

// 渲染考卷列表
function renderExams() {
  examList.innerHTML = "";
  exams.forEach((exam, index) => {
    const li = document.createElement("li");
    li.classList.add("list-item");

    const span = document.createElement("span");
    span.textContent = exam;
    li.appendChild(span);

    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-btn");
    removeBtn.innerHTML = "✕";
    removeBtn.title = "移除考卷";
    removeBtn.addEventListener("click", () => {
      exams.splice(index, 1);
      renderExams();
    });
    li.appendChild(removeBtn);

    examList.appendChild(li);
  });
}

// 新增學生
function addStudent() {
  fetch('/api/save_users/view_all_users/')
    .then(res => res.json())
    .then(data => {
      const allUsers = data.users || [];
      const availableUsers = allUsers.filter(u => u.identities === "學生" && !students.includes(u.username));

      if (availableUsers.length === 0) {
        alert('沒有可加入的學生或所有學生已加入班級。');
        return;
      }

      const dialog = document.createElement('div');
      dialog.classList.add('add-student-dialog');

      const title = document.createElement('h3');
      title.textContent = '選擇要加入的學生';
      dialog.appendChild(title);

      const list = document.createElement('ul');

      availableUsers.forEach((user, index) => {
        const li = document.createElement('li');
        li.classList.add('list-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `add-student-${index}`;
        checkbox.value = user.username;
        checkbox.style.marginRight = '0.5rem';

        const label = document.createElement('label');
        label.htmlFor = `add-student-${index}`;
        label.textContent = user.username;

        li.appendChild(checkbox);
        li.appendChild(label);

        // 點整個 li 框也能勾選
        li.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            checkbox.checked = !checkbox.checked;
          }
        });

        list.appendChild(li);
      });

      dialog.appendChild(list);

      // 按鈕
      const btnContainer = document.createElement('div');
      btnContainer.classList.add('btn-container');

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.classList.add('cancel-btn');
      cancelBtn.addEventListener('click', () => document.body.removeChild(dialog));

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = '加入';
      confirmBtn.classList.add('confirm-btn');
      confirmBtn.addEventListener('click', () => confirmAddStudents(dialog, list, getClassName()));

      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(confirmBtn);
      dialog.appendChild(btnContainer);

      document.body.appendChild(dialog);
    })
    .catch(err => {
      alert('無法載入使用者，請稍後再試。');
      console.error(err);
    });
}

async function confirmAddStudents(dialog, list, className) {
  const checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
  const usernamesToAdd = Array.from(checkboxes).map(cb => cb.value);

  if (usernamesToAdd.length === 0) {
    alert("請先選擇至少一位學生！");
    return;
  }

  try {
    const response = await fetch("/api/save_users/additional_class/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: usernamesToAdd,
        class_name: className
      }),
    });

    if (response.ok) {
      alert("學生已成功加入班級！");
      renderStudents();
      document.body.removeChild(dialog);
    } else {
      const data = await response.json();
      alert("加入學生失敗：" + (data.detail || response.statusText));
    }
  } catch (err) {
    console.error("加入學生錯誤：", err);
    alert("加入學生發生錯誤，請檢查控制台");
  }
}

// 移除學生
async function removeStudent(student) {
    const removeClass = getClassName();
    
    try {
        const response = await fetch("/api/save_users/remove_student_class/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: student,
                class_name: removeClass
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`已成功從 ${removeClass} 移除學生 ${student}`);
            renderStudents(); // 刷新列表
        } else {
            alert(`移除學生失敗：${data.detail || response.statusText}`);
        }
    } catch (err) {
        console.error("移除學生錯誤：", err);
        alert("移除學生發生錯誤，請檢查控制台");
    }
}

// 新增考卷
function addExam() {
  const title = prompt("輸入考卷名稱：");
  if (title) {
    exams.push(title);
    renderExams();
  }
}

// 刪除班級
async function deleteClass() {
  const className = getClassName();

  // 跳出確認訊息
  const confirmDelete = confirm(`確定要刪除班級「${className}」嗎？此操作無法復原！`);
  if (!confirmDelete) return; // 使用者取消

  try {
    const response = await fetch(`/api/save_users/remove_class/?class_name=${encodeURIComponent(className)}`, {
      method: "POST"
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      window.location.replace("/static/tpro.html");
    } else {
      const data = await response.json();
      alert("刪除班級失敗：" + (data.detail || response.statusText));
    }
  } catch (err) {
    console.error("刪除班級錯誤：", err);
    alert("刪除班級發生錯誤，請檢查控制台");
  }
}

// 初始化
function initClassroom() {
  document.getElementById("className").textContent = getClassName();

  renderStudents();
  renderExams();

  document.getElementById("addStudentBtn").addEventListener("click", addStudent);
  document.getElementById("addExamBtn").addEventListener("click", addExam);
  document.getElementById("deleteClassBtn").addEventListener("click", deleteClass);
}

// DOM 加載完畢後初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClassroom);
} else {
  initClassroom();
}

document.getElementById("back-btn").addEventListener("click", () => {
    window.location.replace(`/t/c`);
});