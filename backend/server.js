const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ============================================================
// AUTH ROUTES
// ============================================================

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT u.*, e.id as employee_id, e.full_name, e.department, e.position FROM users u LEFT JOIN employees e ON e.user_id = u.id WHERE u.username = $1 AND u.password = $2',
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      full_name: user.full_name,
      department: user.department,
      position: user.position,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// EMPLOYEE ROUTES (Admin only)
// ============================================================

// GET all employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.username, u.created_at as user_created_at
      FROM employees e
      JOIN users u ON u.id = e.user_id
      ORDER BY e.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD employee
app.post('/api/employees', async (req, res) => {
  const { username, password, full_name, email, department, position } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check username uniqueness
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create user
    const userResult = await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
      [username, password, 'employee']
    );

    // Create employee
    const empResult = await client.query(
      'INSERT INTO employees (user_id, full_name, email, department, position) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userResult.rows[0].id, full_name, email, department, position]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...empResult.rows[0], username, password });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const emp = await pool.query('SELECT user_id FROM employees WHERE id = $1', [req.params.id]);
    if (emp.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    await pool.query('DELETE FROM users WHERE id = $1', [emp.rows[0].user_id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TASK ROUTES
// ============================================================

// GET all tasks (admin sees all, employee sees own)
app.get('/api/tasks', async (req, res) => {
  const { role, employee_id } = req.query;
  try {
    let query = `
      SELECT t.*, e.full_name as employee_name, e.department,
             u.username as assigned_by_username
      FROM tasks t
      JOIN employees e ON e.id = t.assigned_to
      LEFT JOIN users u ON u.id = t.assigned_by
    `;
    let params = [];
    if (role === 'employee' && employee_id) {
      query += ' WHERE t.assigned_to = $1';
      params = [employee_id];
    }
    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE task (admin)
app.post('/api/tasks', async (req, res) => {
  const { title, description, assigned_to, assigned_by, priority, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, assigned_to, assigned_by, priority || 'medium', due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE task progress (employee)
app.patch('/api/tasks/:id/progress', async (req, res) => {
  const { completion_percentage, employee_notes, status } = req.body;
  try {
    let autoStatus = status;
    if (!autoStatus) {
      if (completion_percentage === 0) autoStatus = 'pending';
      else if (completion_percentage === 100) autoStatus = 'completed';
      else autoStatus = 'in_progress';
    }
    const result = await pool.query(
      `UPDATE tasks SET completion_percentage = $1, employee_notes = $2, status = $3
       WHERE id = $4 RETURNING *`,
      [completion_percentage, employee_notes, autoStatus, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task (admin)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATS for dashboard
app.get('/api/stats', async (req, res) => {
  const { employee_id } = req.query;
  try {
    let whereClause = employee_id ? `WHERE assigned_to = ${parseInt(employee_id)}` : '';
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total,
        COALESCE(AVG(completion_percentage), 0) as avg_completion
      FROM tasks ${whereClause}
    `);
    const empCount = employee_id ? null : await pool.query('SELECT COUNT(*) as count FROM employees');
    res.json({
      ...result.rows[0],
      employee_count: empCount ? empCount.rows[0].count : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
