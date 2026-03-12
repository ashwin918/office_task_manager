import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
 
const API = 'https://office-task-manager-5krn.onrender.com';
 
export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/login`, form);
      login(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>⬡</div>
          <h1 style={styles.appName}>WORKHIVE</h1>
          <p style={styles.tagline}>Office Task Management System</p>
        </div>
 
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>USERNAME</label>
            <input
              style={styles.input}
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>
        </form>
 
        <div style={styles.hint}>
          <span style={styles.hintText}>Admin: admin / admin</span>
        </div>
      </div>
    </div>
  );
}
 
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '48px',
    width: '420px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  },
  logoArea: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '48px', color: '#f0a500', display: 'block', marginBottom: '12px' },
  appName: { fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px', letterSpacing: '4px' },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', fontFamily: "'Space Mono', monospace" },
  input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '14px 16px', color: '#fff', fontSize: '15px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', color: '#fca5a5', fontSize: '14px', textAlign: 'center' },
  btn: { background: 'linear-gradient(135deg, #f0a500, #e67e00)', border: 'none', borderRadius: '10px', padding: '16px', color: '#0f0f1a', fontSize: '14px', fontWeight: '700', letterSpacing: '2px', cursor: 'pointer', fontFamily: "'Space Mono', monospace", marginTop: '8px' },
  hint: { textAlign: 'center', marginTop: '24px' },
  hintText: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: "'Space Mono', monospace" },
};