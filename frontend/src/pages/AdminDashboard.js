import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [empForm, setEmpForm] = useState({ username: '', password: '', full_name: '', email: '', department: '', position: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchAll = useCallback(async () => {
    const [e, t, s] = await Promise.all([
      axios.get('/api/employees'),
      axios.get('/api/tasks'),
      axios.get('/api/stats'),
    ]);
    setEmployees(e.data);
    setTasks(t.data);
    setStats(s.data);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const flash = (m, isErr = false) => {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/employees', empForm);
      flash('Employee added successfully!');
      setShowAddEmp(false);
      setEmpForm({ username: '', password: '', full_name: '', email: '', department: '', position: '' });
      fetchAll();
    } catch (er) { flash(er.response?.data?.error || 'Error', true); }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Delete this employee and all their tasks?')) return;
    await axios.delete(`/api/employees/${id}`);
    flash('Employee removed');
    fetchAll();
  };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', { ...taskForm, assigned_by: user.id });
      flash('Task assigned!');
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      fetchAll();
    } catch (er) { flash(er.response?.data?.error || 'Error', true); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`/api/tasks/${id}`);
    flash('Task deleted');
    fetchAll();
  };

  const priorityColor = (p) => ({ high: '#ef4444', medium: '#f0a500', low: '#22c55e' }[p] || '#888');
  const statusBg = (s) => ({ pending: 'rgba(148,163,184,0.15)', in_progress: 'rgba(240,165,0,0.15)', completed: 'rgba(34,197,94,0.15)' }[s]);
  const statusColor = (s) => ({ pending: '#94a3b8', in_progress: '#f0a500', completed: '#22c55e' }[s]);

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.logo}>⬡ WORKHIVE</div>
          <div style={S.adminBadge}>ADMIN PANEL</div>
        </div>
        <nav style={S.nav}>
          {[['dashboard','⬛ Dashboard'],['employees','👤 Employees'],['tasks','📋 Tasks']].map(([key, label]) => (
            <button key={key} style={{ ...S.navBtn, ...(tab === key ? S.navActive : {}) }} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
        <div style={S.sideBottom}>
          <div style={S.userInfo}>
            <div style={S.avatar}>A</div>
            <div>
              <div style={S.userName}>{user.username}</div>
              <div style={S.userRole}>Administrator</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        {(msg || err) && (
          <div style={{ ...S.toast, background: err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)' }}>
            {msg || err}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div style={S.content}>
            <h2 style={S.pageTitle}>Dashboard Overview</h2>
            <div style={S.statsGrid}>
              {[
                { label: 'Total Employees', val: stats.employee_count || 0, icon: '👥', color: '#6366f1' },
                { label: 'Total Tasks', val: stats.total || 0, icon: '📋', color: '#f0a500' },
                { label: 'In Progress', val: stats.in_progress || 0, icon: '⚡', color: '#3b82f6' },
                { label: 'Completed', val: stats.completed || 0, icon: '✅', color: '#22c55e' },
                { label: 'Pending', val: stats.pending || 0, icon: '⏳', color: '#94a3b8' },
                { label: 'Avg. Progress', val: `${Math.round(stats.avg_completion || 0)}%`, icon: '📊', color: '#ec4899' },
              ].map(({ label, val, icon, color }) => (
                <div key={label} style={S.statCard}>
                  <div style={{ ...S.statIcon, background: color + '22', color }}>{icon}</div>
                  <div style={S.statVal}>{val}</div>
                  <div style={S.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <h3 style={S.sectionTitle}>Recent Tasks</h3>
            <div style={S.table}>
              <div style={S.tableHead}>
                <span>Task</span><span>Assigned To</span><span>Priority</span><span>Status</span><span>Progress</span>
              </div>
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} style={S.tableRow}>
                  <span style={S.taskTitle}>{t.title}</span>
                  <span style={S.cell}>{t.employee_name}</span>
                  <span style={{ ...S.badge, color: priorityColor(t.priority), borderColor: priorityColor(t.priority) + '44' }}>
                    {t.priority}
                  </span>
                  <span style={{ ...S.badge, color: statusColor(t.status), background: statusBg(t.status), border: 'none' }}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <div style={S.progressWrap}>
                    <div style={S.progressBar}>
                      <div style={{ ...S.progressFill, width: `${t.completion_percentage}%` }} />
                    </div>
                    <span style={S.progText}>{t.completion_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {tab === 'employees' && (
          <div style={S.content}>
            <div style={S.pageHeader}>
              <h2 style={S.pageTitle}>Employees</h2>
              <button style={S.addBtn} onClick={() => setShowAddEmp(true)}>+ Add Employee</button>
            </div>

            {showAddEmp && (
              <div style={S.modal}>
                <div style={S.modalCard}>
                  <h3 style={S.modalTitle}>Add New Employee</h3>
                  <form onSubmit={addEmployee} style={S.modalForm}>
                    <div style={S.formGrid}>
                      {[
                        ['full_name', 'Full Name', 'text'],
                        ['email', 'Email', 'email'],
                        ['username', 'Username (Login)', 'text'],
                        ['password', 'Password (Login)', 'text'],
                        ['department', 'Department', 'text'],
                        ['position', 'Position / Role', 'text'],
                      ].map(([field, label, type]) => (
                        <div key={field} style={S.formField}>
                          <label style={S.formLabel}>{label}</label>
                          <input style={S.formInput} type={type} required={['full_name','email','username','password'].includes(field)}
                            value={empForm[field]} onChange={e => setEmpForm({ ...empForm, [field]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                    <div style={S.modalActions}>
                      <button type="button" style={S.cancelBtn} onClick={() => setShowAddEmp(false)}>Cancel</button>
                      <button type="submit" style={S.submitBtn}>Add Employee</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={S.empGrid}>
              {employees.map(emp => (
                <div key={emp.id} style={S.empCard}>
                  <div style={S.empAvatar}>{emp.full_name[0]}</div>
                  <div style={S.empInfo}>
                    <div style={S.empName}>{emp.full_name}</div>
                    <div style={S.empDept}>{emp.position} {emp.department ? `• ${emp.department}` : ''}</div>
                    <div style={S.empCreds}>
                      <span style={S.credBadge}>👤 {emp.username}</span>
                    </div>
                    <div style={S.empEmail}>{emp.email}</div>
                  </div>
                  <button style={S.deleteBtn} onClick={() => deleteEmployee(emp.id)}>✕</button>
                </div>
              ))}
              {employees.length === 0 && <div style={S.empty}>No employees yet. Add one to get started.</div>}
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <div style={S.content}>
            <div style={S.pageHeader}>
              <h2 style={S.pageTitle}>All Tasks</h2>
              <button style={S.addBtn} onClick={() => setShowAddTask(true)}>+ Assign Task</button>
            </div>

            {showAddTask && (
              <div style={S.modal}>
                <div style={S.modalCard}>
                  <h3 style={S.modalTitle}>Assign New Task</h3>
                  <form onSubmit={addTask} style={S.modalForm}>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Task Title</label>
                      <input style={S.formInput} type="text" required value={taskForm.title}
                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                    </div>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Description</label>
                      <textarea style={{ ...S.formInput, height: '80px', resize: 'vertical' }} value={taskForm.description}
                        onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                    </div>
                    <div style={S.formGrid}>
                      <div style={S.formField}>
                        <label style={S.formLabel}>Assign To</label>
                        <select style={S.formInput} required value={taskForm.assigned_to}
                          onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.department || 'N/A'})</option>
                          ))}
                        </select>
                      </div>
                      <div style={S.formField}>
                        <label style={S.formLabel}>Priority</label>
                        <select style={S.formInput} value={taskForm.priority}
                          onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div style={S.formField}>
                        <label style={S.formLabel}>Due Date</label>
                        <input style={S.formInput} type="date" value={taskForm.due_date}
                          onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                      </div>
                    </div>
                    <div style={S.modalActions}>
                      <button type="button" style={S.cancelBtn} onClick={() => setShowAddTask(false)}>Cancel</button>
                      <button type="submit" style={S.submitBtn}>Assign Task</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={S.taskList}>
              {tasks.map(t => (
                <div key={t.id} style={S.taskCard}>
                  <div style={S.taskCardTop}>
                    <div style={S.taskCardLeft}>
                      <div style={S.taskCardTitle}>{t.title}</div>
                      <div style={S.taskCardMeta}>
                        Assigned to: <strong>{t.employee_name}</strong>
                        {t.department && <span style={S.deptTag}>{t.department}</span>}
                        {t.due_date && <span style={S.dueTag}>Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                      </div>
                      {t.description && <div style={S.taskDesc}>{t.description}</div>}
                      {t.employee_notes && (
                        <div style={S.empNote}><em>Employee note:</em> {t.employee_notes}</div>
                      )}
                    </div>
                    <div style={S.taskCardRight}>
                      <span style={{ ...S.badge, color: priorityColor(t.priority), borderColor: priorityColor(t.priority) + '44' }}>
                        {t.priority}
                      </span>
                      <span style={{ ...S.badge, color: statusColor(t.status), background: statusBg(t.status), border: 'none', marginLeft: 8 }}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <button style={S.deleteBtnSm} onClick={() => deleteTask(t.id)}>✕</button>
                    </div>
                  </div>
                  <div style={S.taskProgress}>
                    <div style={S.progressBar}>
                      <div style={{ ...S.progressFill, width: `${t.completion_percentage}%` }} />
                    </div>
                    <span style={S.progText}>{t.completion_percentage}%</span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div style={S.empty}>No tasks assigned yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0d0d18', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0' },
  sidebar: { width: '240px', background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideTop: { padding: '28px 24px 20px' },
  logo: { fontFamily: "'Space Mono', monospace", fontSize: '16px', fontWeight: '700', color: '#f0a500', letterSpacing: '2px', marginBottom: '8px' },
  adminBadge: { fontSize: '10px', background: 'rgba(240,165,0,0.15)', color: '#f0a500', borderRadius: '4px', padding: '3px 8px', display: 'inline-block', letterSpacing: '1px', fontFamily: "'Space Mono', monospace" },
  nav: { flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', textAlign: 'left', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
  navActive: { background: 'rgba(240,165,0,0.12)', color: '#f0a500' },
  sideBottom: { padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#f0a500,#e67e00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#0d0d18', fontSize: '15px' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  userRole: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
  logoutBtn: { width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', padding: '9px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  main: { flex: 1, overflow: 'auto', position: 'relative' },
  content: { padding: '32px 36px', maxWidth: '1100px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#fff', marginBottom: '24px', marginTop: 0 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: '36px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' },
  statIcon: { width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statVal: { fontSize: '32px', fontWeight: '700', color: '#fff', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.45)' },
  table: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1.5fr', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1.5fr', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' },
  taskTitle: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  cell: { fontSize: '13px', color: 'rgba(255,255,255,0.6)' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-block' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  progressBar: { flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#f0a500,#22c55e)', borderRadius: '3px', transition: 'width 0.3s' },
  progText: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', minWidth: '32px' },
  addBtn: { background: 'linear-gradient(135deg,#f0a500,#e67e00)', border: 'none', borderRadius: '10px', color: '#0d0d18', padding: '11px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  empGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  empCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative' },
  empAvatar: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#fff', flexShrink: 0 },
  empInfo: { flex: 1 },
  empName: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  empDept: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' },
  empCreds: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' },
  credBadge: { fontSize: '11px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: '6px', padding: '3px 10px' },
  empEmail: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' },
  deleteBtn: { background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fca5a5', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px', position: 'absolute', top: '16px', right: '16px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  taskCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' },
  taskCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  taskCardLeft: { flex: 1 },
  taskCardRight: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '16px' },
  taskCardTitle: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' },
  taskCardMeta: { fontSize: '13px', color: 'rgba(255,255,255,0.45)' },
  deptTag: { marginLeft: '8px', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' },
  dueTag: { marginLeft: '8px', color: '#f0a500', fontSize: '12px' },
  taskDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' },
  empNote: { fontSize: '13px', color: 'rgba(99,202,255,0.7)', marginTop: '8px', fontStyle: 'italic' },
  deleteBtnSm: { background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fca5a5', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px', marginLeft: '8px' },
  taskProgress: { display: 'flex', alignItems: 'center', gap: '10px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '36px', width: '560px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#fff', marginTop: 0, marginBottom: '24px' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" },
  formInput: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', padding: '10px 20px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
  submitBtn: { background: 'linear-gradient(135deg,#f0a500,#e67e00)', border: 'none', borderRadius: '8px', color: '#0d0d18', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '14px 22px', borderRadius: '10px', color: '#fff', fontWeight: '600', zIndex: 999, fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  empty: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px', fontSize: '14px' },
};
