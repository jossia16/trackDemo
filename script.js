// --- GLOBAL DATA (Simulated Backend with localStorage) ---
let users = JSON.parse(localStorage.getItem('users')) || [
  { username: "teacher01", password: "teach123", role: "teacher" }
];
let students = JSON.parse(localStorage.getItem('students')) || [];

// --- UI Management Functions ---
function showSection(sectionId) {
    // Hide all possible sections first
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('teacherSection').classList.add('hidden');
    document.getElementById('parentSection').classList.add('hidden');

    // Show the requested section
    if (sectionId === 'login') {
        document.getElementById('loginSection').classList.remove('hidden');
        updateMainTitle('EduTrack: Student Insight', 'https://img.icons8.com/color/48/student-male--v1.png');
        document.getElementById("loginForm").reset();
        document.getElementById("errorMsg").innerText = "";
    } else if (sectionId === 'register') {
        document.getElementById('registerSection').classList.remove('hidden');
        updateMainTitle('EduTrack: Register Teacher', 'https://img.icons8.com/color/48/add-user-male--v1.png');
        document.getElementById("registerForm").reset();
    } else if (sectionId === 'teacher') {
        document.getElementById('teacherSection').classList.remove('hidden');
        updateMainTitle('Teacher Dashboard', 'https://img.icons8.com/color/48/classroom.png');
        renderTeacherTable();
    } else if (sectionId === 'parent') {
        document.getElementById('parentSection').classList.remove('hidden');
        updateMainTitle('Parent Dashboard', 'https://img.icons8.com/color/48/family.png');
        renderParentInfo();
    }

    // Scroll to the top of the page for a clean "new page" feel
    window.scrollTo(0, 0);
}

// Updates the main title and icon dynamically
function updateMainTitle(text, iconSrc) {
    const titleSpan = document.querySelector('#mainTitle .animated-title');
    const titleIcon = document.querySelector('#mainTitle .icon');
    if (titleSpan) titleSpan.textContent = text;
    if (titleIcon) titleIcon.src = iconSrc;
}

// Helper functions for auth forms
function showRegisterForm() {
  showSection('register');
}

function showLoginForm() {
  showSection('login');
}

// --- Authentication and User Management ---
document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  let currentUsers = JSON.parse(localStorage.getItem('users')) || [];

  if (currentUsers.some(u => u.username === username)) {
      alert("Username already exists. Please choose a different one.");
      return;
  }

  currentUsers.push({ username, password, role: "teacher" });
  localStorage.setItem('users', JSON.stringify(currentUsers));
  alert("Account created. Please log in.");
  showLoginForm();
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const role = document.getElementById("loginRole").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  
  const currentUsers = JSON.parse(localStorage.getItem('users'));
  const currentStudents = JSON.parse(localStorage.getItem('students'));

  const user = currentUsers.find(u => u.username === username && u.password === password && u.role === role);

  if (!user) {
    document.getElementById("errorMsg").innerText = "Invalid credentials.";
    return;
  }

  sessionStorage.setItem('loggedInUser', JSON.stringify(user));

  if (user.role === "teacher") {
    showSection('teacher');
  } else { // parent
    const student = currentStudents.find(s => s.parentUsername === user.username);
    if (student) {
        sessionStorage.setItem('parentStudentId', student.id);
        showSection('parent');
    } else {
        document.getElementById("errorMsg").innerText = "No student record found for this parent account. Please contact the teacher.";
        sessionStorage.removeItem('loggedInUser');
    }
  }
});

function logout() {
  sessionStorage.removeItem('loggedInUser');
  sessionStorage.removeItem('parentStudentId');
  showSection('login');
}

// --- Teacher Dashboard Functions ---
function addSubjectRow() {
  const div = document.createElement("div");
  div.className = "input-group my-1";
  div.innerHTML = `
    <input class="form-control subject" placeholder="Subject" />
    <input class="form-control grade" placeholder="Grade" />
    <button type="button" class="btn btn-outline-secondary" onclick="removeSubjectRow(this)">Remove</button>`;
  document.getElementById("subjectsArea").appendChild(div);
}

function removeSubjectRow(button) {
  button.parentElement.remove();
}

document.getElementById("addStudentForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const attendance = document.getElementById("attendance").value;
  const remarks = document.getElementById("remarks").value;
  const parentUsername = document.getElementById("parentUsername").value;
  const parentPassword = document.getElementById("parentPassword").value;
  const photoInput = document.getElementById("photo");

  const subjects = [...document.querySelectorAll(".subject")].map((s, i) => ({
    subject: s.value,
    grade: document.querySelectorAll(".grade")[i].value
  }));

  let currentUsers = JSON.parse(localStorage.getItem('users'));
  if (currentUsers.some(u => u.username === parentUsername && u.role === 'parent')) {
      alert("Parent username already exists. Please choose a different one or use an existing parent account.");
      return;
  }

  const studentId = Date.now().toString();

  const reader = new FileReader();
  reader.onload = function (event) {
    const student = {
      id: studentId,
      name,
      attendance,
      remarks,
      subjects,
      parentUsername,
      photo: event.target.result
    };
    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));

    currentUsers.push({ username: parentUsername, password: parentPassword, role: "parent" });
    localStorage.setItem('users', JSON.stringify(currentUsers));

    renderTeacherTable();
    this.reset();
    document.getElementById("subjectsArea").innerHTML = `
      <div class="input-group my-1">
        <input class="form-control subject" placeholder="Subject" />
        <input class="form-control grade" placeholder="Grade" />
        <button type="button" class="btn btn-outline-secondary" onclick="removeSubjectRow(this)">Remove</button>
      </div>`;
  }.bind(this);

  if (photoInput.files.length > 0) {
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    const student = { id: studentId, name, attendance, remarks, subjects, parentUsername, photo: null };
    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));

    currentUsers.push({ username: parentUsername, password: parentPassword, role: "parent" });
    localStorage.setItem('users', JSON.stringify(currentUsers));

    renderTeacherTable();
    this.reset();
    document.getElementById("subjectsArea").innerHTML = `
      <div class="input-group my-1">
        <input class="form-control subject" placeholder="Subject" />
        <input class="form-control grade" placeholder="Grade" />
        <button type="button" class="btn btn-outline-secondary" onclick="removeSubjectRow(this)">Remove</button>
      </div>`;
  }
});

function renderTeacherTable() {
  students = JSON.parse(localStorage.getItem('students')) || [];

  let html = `<table class="table table-bordered mt-3"><thead><tr><th>Photo</th><th>Name</th><th>Attendance</th><th>Remarks</th><th>Subjects & Grades</th><th>Parent Username</th><th>Action</th></tr></thead><tbody>`;
  students.forEach((s, i) => {
    const subjectInputs = s.subjects.map((sg, j) => `
      <input class="form-control mb-1" value="${sg.subject}" onchange="editSubject(${i}, ${j}, 'subject', this.value)" />
      <input class="form-control mb-1" value="${sg.grade}" onchange="editSubject(${i}, ${j}, 'grade', this.value)" />`).join('');
    html += `<tr>
      <td>${s.photo ? `<img src="${s.photo}" class="student-photo-preview" alt="Student Photo"/>` : ''}</td>
      <td><input class="form-control" value="${s.name}" onchange="editStudent(${i}, 'name', this.value)"></td>
      <td><input class="form-control" value="${s.attendance}" onchange="editStudent(${i}, 'attendance', this.value)"></td>
      <td><input class="form-control" value="${s.remarks}" onchange="editStudent(${i}, 'remarks', this.value)"></td>
      <td>${subjectInputs}</td>
      <td><input class="form-control" value="${s.parentUsername}" readonly></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteStudent(${i})">Delete</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById("teacherStudentList").innerHTML = html;
}

function editStudent(index, field, value) {
  students[index][field] = value;
  localStorage.setItem('students', JSON.stringify(students));
}

function editSubject(studentIndex, subjectIndex, field, value) {
  students[studentIndex].subjects[subjectIndex][field] = value;
  localStorage.setItem('students', JSON.stringify(students));
}

function deleteStudent(index) {
  if (confirm("Are you sure you want to delete this student and their associated parent account?")) {
    const studentToDelete = students[index];
    
    let currentUsers = JSON.parse(localStorage.getItem('users'));
    const initialUserCount = currentUsers.length;

    currentUsers = currentUsers.filter(u => !(u.username === studentToDelete.parentUsername && u.role === 'parent'));
    if (currentUsers.length < initialUserCount) {
        alert("Associated parent account also deleted.");
        localStorage.setItem('users', JSON.stringify(currentUsers));
    }

    students.splice(index, 1);
    localStorage.setItem('students', JSON.stringify(students));
    renderTeacherTable();
  }
}

// --- Parent Dashboard Functions ---
function renderParentInfo() {
    students = JSON.parse(localStorage.getItem('students')) || [];

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const parentStudentId = sessionStorage.getItem('parentStudentId');

    if (!loggedInUser || loggedInUser.role !== 'parent' || !parentStudentId) {
        document.getElementById("parentStudentInfo").innerHTML = `
            <p class="text-danger">Access denied. Please log in as a parent.</p>`;
        return;
    }

    const student = students.find(s => s.parentUsername === loggedInUser.username && s.id === parentStudentId);

    if (student) {
      document.getElementById("parentStudentInfo").innerHTML = `
        <h5>${student.name}</h5>
        ${student.photo ? `<img src="${student.photo}" class="student-photo-preview" alt="Student Photo"/>` : '<p class="text-muted">No photo available</p>'}
        <p><strong>Attendance:</strong> ${student.attendance}%</p>
        <p><strong>Remarks:</strong> ${student.remarks}</p>
        <h6 class="mt-4">Subjects and Grades</h6>
        <ul class="list-group list-group-flush">
            ${student.subjects.map(sg => `<li class="list-group-item">${sg.subject}: <strong>${sg.grade}</strong></li>`).join('')}
        </ul>`;
    } else {
      document.getElementById("parentStudentInfo").innerHTML = `
        <p class="text-danger">No student record found for your account. Please contact the teacher.</p>`;
    }
}

// --- Global Functions ---
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// --- Initial Page Load Logic ---
window.onload = () => {
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
    }

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (loggedInUser) {
        if (loggedInUser.role === 'teacher') {
            showSection('teacher');
        } else if (loggedInUser.role === 'parent') {
            const parentStudentId = sessionStorage.getItem('parentStudentId');
            if (parentStudentId) {
                showSection('parent');
            } else {
                logout(); // Log out if parent is logged in but no student associated
            }
        }
    } else {
        showSection('login');
    }

    // Initialize localStorage for users and students if not already present
    // This ensures data structure exists even if empty, preventing errors
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(users));
    }
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify(students));
    }
};