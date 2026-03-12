import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
 
const API = 'https://office-task-manager-5krn.onrender.com';
 
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [editing, setEditing] = useState(null);
  const [updateForm, setUpdateForm] = useState({ completion_percentage: 0, employee_notes: '' });
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');
 
  const fetchData = useCallback(async () => {
    const [t, s] = await Promise.all([
      axios.get(`${API}/api/tasks?role=employee&employee_id=${user.employee_id}`),
      axios.get(`${API}/api/stats?employee_id=${user.employee_id}`),
    ]);
    setTasks(t.data);
    setStats(s.data);
  }, [user.employee_id]);
 
  useEffect(() => { fetchData(); }, [fetchData]);
 
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
 
  const openEdit = (task) => {
    setEditing(task.id);
    setUpdateForm({ completion_percentage: task.completion_percentage, employee_notes: task.employee_notes || '' });
  };
 
  const saveProgress = async (taskId) => {
    try {
      await axios.patch(`${API}/api/tasks/${taskId}/progress`, updateForm);
      flash('Progress updated!');
      setEditing(null);
      fetchData();
    } catch (e) { flash('Error updating task'); }
  };
 
  const priorityColor = (p) => ({ high: '#ef4444', medium: '#f0a500', low: '#22c55e' }[p] || '#888');
  const statusBg = (s) => ({ pending: 'rgba(148,163,184,0.15)', in_progress: 'rgba(240,165,0,0.15)', completed: 'rgba(34,197,94,0.15)' }[s]);
  const statusColor = (s) => ({ pending: '#94a3b8', in_progress: '#f0a500', completed: '#22c55e' }[s]);
 
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
 
  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.logo}>⬡ WORKHIVE</div>
          <div style={S.empBadge}>EMPLOYEE</div>
        </div>
        <div style={S.profile}>
          <div style={S.bigAvatar}>{(user.full_name || user.username)[0].toUpperCase()}</div>
          <div style={S.profileName}>{user.full_name || user.username}</div>
          {user.position && <div style={S.profilePos}>{user.position}</div>}
          {user.department && <div style={S.profileDept}>{user.department}</div>}
        </div>
        <div style={S.miniStats}>
          {[
            { label: 'Total', val: stats.total || 0 },
            { label: 'Done', val: stats.completed || 0 },
            { label: 'Active', val: stats.in_progress || 0 },
          ].map(({ label, val }) => (
            <div key={label} style={S.miniStat}>
              <div style={S.miniVal}>{val}</div>
              <div style={S.miniLabel}>{label}</div>
            </div>
          ))}
        </div>
        <div style={S.sideBottom}>
          <div style={S.avgProgress}>
            <div style={S.avgLabel}>Overall Progress</div>
            <div style={S.bigPercent}>{Math.round(stats.avg_completion || 0)}%</div>
            <div style={S.bigBar}>
              <div style={{ ...S.bigFill, width: `${stats.avg_completion || 0}%` }} />
            </div>
          </div>
          <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </div>
 
      {/* MAIN */}
      <div style={S.main}>
        {msg && <div style={S.toast}>{msg}</div>}
 
        <div style={S.content}>
          <div style={S.pageHeader}>
            <div>
              <h2 style={S.pageTitle}>My Tasks</h2>
              <p style={S.pageSub}>Update your progress and add notes for each task</p>
            </div>
            <div style={S.filters}>
              {[['all','All'],['pending','Pending'],['in_progress','In Progress'],['completed','Completed']].map(([val, label]) => (
                <button key={val} style={{ ...S.filterBtn, ...(filter === val ? S.filterActive : {}) }} onClick={() => setFilter(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
 
          <div style={S.taskList}>
            {filtered.map(task => (
              <div key={task.id} style={S.taskCard}>
                <div style={S.cardHeader}>
                  <div style={S.cardLeft}>
                    <div style={S.taskTitle}>{task.title}</div>
                    <div style={S.taskMeta}>
                      <span style={{ ...S.badge, color: priorityColor(task.priority), borderColor: priorityColor(task.priority) + '44' }}>
                        {task.priority} priority
                      </span>
                      <span style={{ ...S.badge, color: statusColor(task.status), background: statusBg(task.status), border: 'none' }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.due_date && (
                        <span style={S.due}>📅 Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {task.description && <div style={S.taskDesc}>{task.description}</div>}
                  </div>
                  <div style={S.cardRight}>
                    <div style={S.bigPercentSmall}>{task.completion_percentage}%</div>
                    <button style={S.updateBtn} onClick={() => openEdit(task.id === editing ? null : task)}>
                      {editing === task.id ? 'Cancel' : 'Update'}
                    </button>
                  </div>
                </div>
 
                <div style={S.progressSection}>
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${task.completion_percentage}%` }} />
                  </div>
                </div>
 
                {task.employee_notes && editing !== task.id && (
                  <div style={S.noteDisplay}>💬 {task.employee_notes}</div>
                )}
 
                {editing === task.id && (
                  <div style={S.editPanel}>
                    <div style={S.editRow}>
                      <label style={S.editLabel}>COMPLETION: {updateForm.completion_percentage}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={updateForm.completion_percentage}
                        onChange={e => setUpdateForm({ ...updateForm, completion_percentage: parseInt(e.target.value) })}
                        style={S.slider}
                      />
                      <div style={S.sliderLabels}><span>0%</span><span>50%</span><span>100%</span></div>
                    </div>
                    <div style={S.editRow}>
                      <label style={S.editLabel}>NOTES / COMMENTS</label>
                      <textarea
                        style={S.noteInput}
                        placeholder="Add a note about your progress..."
                        value={updateForm.employee_notes}
                        onChange={e => setUpdateForm({ ...updateForm, employee_notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div style={S.quickPcts}>
                      {[0, 25, 50, 75, 100].map(p => (
                        <button key={p} style={{ ...S.pctBtn, ...(updateForm.completion_percentage === p ? S.pctActive : {}) }}
                          onClick={() => setUpdateForm({ ...updateForm, completion_percentage: p })}>
                          {p}%
                        </button>
                      ))}
                    </div>
                    <button style={S.saveBtn} onClick={() => saveProgress(task.id)}>
                      Save Progress →
                    </button>
                  </div>
                )}
              </div>
            ))}
 
            {filtered.length === 0 && (
              <div style={S.empty}>
                <div style={S.emptyIcon}>📭</div>
                <div>No tasks {filter !== 'all' ? `with status "${filter.replace('_', ' ')}"` : 'assigned yet'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0d0d18', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0' },
  sidebar: { width: '260px', background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideTop: { padding: '28px 24px 20px' },
  logo: { fontFamily: "'Space Mono', monospace", fontSize: '16px', fontWeight: '700', color: '#f0a500', letterSpacing: '2px', marginBottom: '8px' },
  empBadge: { fontSize: '10px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: '4px', padding: '3px 8px', display: 'inline-block', letterSpacing: '1px', fontFamily: "'Space Mono', monospace" },
  profile: { padding: '20px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  bigAvatar: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 auto 12px' },
  profileName: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  profilePos: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  profileDept: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' },
  miniStats: { display: 'flex', padding: '16px 24px', gap: '8px' },
  miniStat: { flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 4px' },
  miniVal: { fontSize: '20px', fontWeight: '700', color: '#fff' },
  miniLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.35)' },
  sideBottom: { marginTop: 'auto', padding: '20px' },
  avgProgress: { marginBottom: '16px' },
  avgLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Space Mono', monospace", marginBottom: '6px' },
  bigPercent: { fontSize: '36px', fontWeight: '700', color: '#f0a500', lineHeight: 1, marginBottom: '8px' },
  bigBar: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  bigFill: { height: '100%', background: 'linear-gradient(90deg,#f0a500,#22c55e)', borderRadius: '3px', transition: 'width 0.5s' },
  logoutBtn: { width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', padding: '9px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  main: { flex: 1, overflow: 'auto' },
  content: { padding: '32px 36px', maxWidth: '900px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#fff', margin: '0 0 6px' },
  pageSub: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  filterActive: { background: 'rgba(240,165,0,0.15)', borderColor: '#f0a500', color: '#f0a500' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  taskCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  cardLeft: { flex: 1 },
  cardRight: { textAlign: 'right', flexShrink: 0, marginLeft: '20px' },
  taskTitle: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '10px' },
  taskMeta: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-block' },
  due: { fontSize: '12px', color: '#f0a500' },
  taskDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '8px', lineHeight: '1.5' },
  bigPercentSmall: { fontSize: '28px', fontWeight: '700', color: '#f0a500', fontFamily: "'Space Mono', monospace" },
  updateBtn: { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '6px' },
  progressSection: { marginBottom: '12px' },
  progressBar: { height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#6366f1,#f0a500,#22c55e)', borderRadius: '4px', transition: 'width 0.5s' },
  noteDisplay: { fontSize: '13px', color: 'rgba(99,202,255,0.7)', fontStyle: 'italic', marginTop: '8px' },
  editPanel: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' },
  editRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  editLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" },
  slider: { width: '100%', accentColor: '#f0a500', cursor: 'pointer', height: '6px' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.3)' },
  noteInput: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.5' },
  quickPcts: { display: 'flex', gap: '8px' },
  pctBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Space Mono', monospace" },
  pctActive: { background: 'rgba(240,165,0,0.2)', borderColor: '#f0a500', color: '#f0a500' },
  saveBtn: { background: 'linear-gradient(135deg,#f0a500,#e67e00)', border: 'none', borderRadius: '10px', color: '#0d0d18', padding: '14px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-end' },
  toast: { position: 'fixed', top: '20px', right: '20px', background: 'rgba(34,197,94,0.9)', padding: '14px 22px', borderRadius: '10px', color: '#fff', fontWeight: '600', zIndex: 999, fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
};