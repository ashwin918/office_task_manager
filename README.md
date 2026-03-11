# 🏢 WORKHIVE - Office Task Manager

A full-stack office task management system with admin and employee roles.

---

## 🗄️ STEP 1: Setup PostgreSQL Database (pgAdmin)

1. Open **pgAdmin**
2. Connect to your PostgreSQL server
3. Right-click **Databases** → **Create** → **Database**
4. Name it: `office_task_manager` → Click **Save**
5. Click on `office_task_manager` → Open **Query Tool**
6. Open the file `database.sql` from this folder
7. Paste the entire contents into the Query Tool
8. Click **▶ Execute** (or press F5)
9. You should see: `"Database setup complete!"`

---

## ⚙️ STEP 2: Configure Backend

1. Open `backend/.env` in VS Code
2. Update your PostgreSQL password:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_task_manager
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
PORT=5000
```

---

## 🚀 STEP 3: Run the Backend

Open a **terminal** in VS Code:

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 Server running on http://localhost:5000
```

---

## 💻 STEP 4: Run the Frontend

Open a **second terminal** in VS Code:

```bash
cd frontend
npm install
npm start
```

The app will open at: **http://localhost:3000**

---

## 🔐 Login Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin    |

> Admin creates employees with their own unique username & password.

---

## 📋 Features

### Admin Can:
- ✅ View dashboard with stats (employees, tasks, completion rates)
- ✅ Add employees (assign unique username + password)
- ✅ Delete employees
- ✅ Assign tasks to employees with priority & due date
- ✅ View all tasks and progress
- ✅ Delete tasks

### Employee Can:
- ✅ Login with assigned credentials
- ✅ View only their assigned tasks
- ✅ Update completion percentage (0–100%)
- ✅ Add progress notes
- ✅ Filter tasks by status
- ✅ View overall progress stats

---

## 🗂️ Project Structure

```
office-task-manager/
├── database.sql          ← Run this in pgAdmin
├── backend/
│   ├── server.js         ← Express API
│   ├── db.js             ← PostgreSQL connection
│   ├── .env              ← DB credentials (edit this!)
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   └── pages/
    │       ├── Login.js
    │       ├── AdminDashboard.js
    │       └── EmployeeDashboard.js
    └── package.json
```

---

## 🛠️ Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via `pg` npm package)
- **Styling**: Inline CSS (no external dependencies)
