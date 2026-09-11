import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Edit3, Shield, 
  Check, X, Search, ShieldCheck, Mail, Key, UserPlus, RefreshCw
} from 'lucide-react';

const ROLE_COLORS = {
  'Super Admin': { bg: 'rgba(230, 57, 70, 0.2)', text: '#ff858d', border: 'rgba(230, 57, 70, 0.4)' },
  'Redaktur Pelaksana': { bg: 'rgba(212, 175, 55, 0.2)', text: 'var(--accent-gold)', border: 'rgba(212, 175, 55, 0.4)' },
  'Editor': { bg: 'rgba(157, 78, 221, 0.2)', text: '#c77dff', border: 'rgba(157, 78, 221, 0.4)' },
  'Jurnalis': { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' }
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formRole, setFormRole] = useState('Editor');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const currentAdmin = (() => {
    try {
      const stored = localStorage.getItem('calonjenazah_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  })();

  const fetchAdmins = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.admins)) {
          setAdmins(data.admins);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openCreateModal = () => {
    setFormUsername('');
    setFormPassword('');
    setFormDisplayName('');
    setFormRole('Editor');
    setFormEmail('');
    setFormIsActive(true);
    setShowCreateModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormDisplayName(admin.display_name);
    setFormRole(admin.role);
    setFormEmail(admin.email || '');
    setFormIsActive(Boolean(admin.is_active));
    setFormPassword(''); // Empty means don't change
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword.trim() || !formDisplayName.trim()) return;

    setIsSaving(true);
    fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formUsername.trim(),
        password: formPassword.trim(),
        display_name: formDisplayName.trim(),
        role: formRole,
        email: formEmail.trim()
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsSaving(false);
        if (data.success) {
          setShowCreateModal(false);
          setSuccessMsg(data.message || 'Akun admin berhasil ditambahkan');
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchAdmins();
        } else {
          alert(data.error || 'Gagal menambahkan akun admin');
        }
      })
      .catch(() => {
        setIsSaving(false);
        alert('Terjadi kesalahan jaringan');
      });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingAdmin || !formDisplayName.trim()) return;

    setIsSaving(true);
    const payload = {
      display_name: formDisplayName.trim(),
      role: formRole,
      email: formEmail.trim(),
      is_active: formIsActive
    };

    if (formPassword.trim()) {
      payload.password = formPassword.trim();
    }

    fetch(`/api/admin/users/${editingAdmin.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setIsSaving(false);
        if (data.success) {
          setEditingAdmin(null);
          setSuccessMsg(data.message || 'Data admin berhasil diperbarui');
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchAdmins();
        } else {
          alert(data.error || 'Gagal memperbarui akun admin');
        }
      })
      .catch(() => {
        setIsSaving(false);
        alert('Terjadi kesalahan jaringan');
      });
  };

  const handleDelete = (admin) => {
    if (admin.role === 'Super Admin' && admins.filter(a => a.role === 'Super Admin').length <= 1) {
      alert('Tidak dapat menghapus satu-satunya Super Admin dalam sistem.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus akun admin: "${admin.display_name}" (@${admin.username})?`)) {
      return;
    }

    fetch(`/api/admin/users/${admin.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccessMsg(data.message || 'Akun admin berhasil dihapus');
          setTimeout(() => setSuccessMsg(''), 4000);
          setAdmins(admins.filter(a => a.id !== admin.id));
        } else {
          alert(data.error || 'Gagal menghapus admin');
        }
      })
      .catch(() => alert('Terjadi kesalahan jaringan'));
  };

  const filtered = admins.filter(a => {
    const matchesSearch = !search.trim() || 
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.12) 0%, rgba(20, 24, 34, 0.8) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'var(--accent-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(230, 57, 70, 0.4)'
          }}>
            <Users size={26} color="#fff" />
          </div>
          <div>
            <h2 className="display-font" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Manajemen Akun Administrator &amp; Redaksi
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Kelola hak akses pengguna, dewan redaksi, editor berita, dan jurnalis portal CALON JENAZAH.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-crimson)',
            color: '#fff',
            padding: '11px 22px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 4px 18px rgba(230, 57, 70, 0.4)'
          }}
        >
          <UserPlus size={16} />
          <span>Tambah Akun Admin</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#34d399',
          fontSize: '0.88rem'
        }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controls Bar: Search & Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 12px',
            width: '100%'
          }}>
            <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Cari nama, username, email admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem',
                color: '#fff'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Semua Role ({admins.length})</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Redaktur Pelaksana">Redaktur Pelaksana</option>
            <option value="Editor">Editor</option>
            <option value="Jurnalis">Jurnalis</option>
          </select>
        </div>

        <button
          onClick={fetchAdmins}
          style={{
            padding: '9px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Admins Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#0c0f16', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px' }}>Pengguna / Redaksi</th>
                <th style={{ padding: '14px 18px' }}>Role / Jabatan</th>
                <th style={{ padding: '14px 18px' }}>Email</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Terakhir Login</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat data administrator...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada data akun admin yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((adm) => {
                  const roleStyle = ROLE_COLORS[adm.role] || ROLE_COLORS['Editor'];
                  const initials = (adm.display_name || adm.username || 'AD')
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: adm.role === 'Super Admin' 
                              ? 'linear-gradient(135deg, var(--accent-crimson), #900c14)' 
                              : 'linear-gradient(135deg, #1f293d, #0d121c)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            color: '#fff',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#fff' }}>
                              {adm.display_name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--accent-gold)' }}>
                              @{adm.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.border}`
                        }}>
                          {adm.role}
                        </span>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {adm.email || '-'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {adm.is_active ? (
                          <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {adm.last_login ? new Date(adm.last_login).toLocaleString('id-ID') : 'Belum pernah login'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(adm)}
                            style={{
                              padding: '7px',
                              background: 'rgba(255,255,255,0.06)',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                            title="Edit data admin"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(adm)}
                            style={{
                              padding: '7px',
                              background: 'rgba(230, 57, 70, 0.15)',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#ff858d',
                              cursor: 'pointer'
                            }}
                            title="Hapus akun admin"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <form onSubmit={handleCreate} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-crimson)" />
                <h3 className="display-font" style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>
                  Tambah Akun Admin Baru
                </h3>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Username (Digunakan untuk Login)
              </label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="misal: ahmad_editor"
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Password Login
              </label>
              <input
                type="password"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap / Gelar Redaksi
              </label>
              <input
                type="text"
                required
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="misal: Ahmad Fauzi, S.I.Kom"
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Role Jabatan
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Redaktur Pelaksana">Redaktur Pelaksana</option>
                  <option value="Editor">Editor</option>
                  <option value="Jurnalis">Jurnalis</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="editor@calonjenazah.com"
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{ padding: '8px 24px', background: 'var(--accent-crimson)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAdmin && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <form onSubmit={handleUpdate} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 className="display-font" style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>
                  Edit Akun: @{editingAdmin.username}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Perbarui profil atau reset kata sandi</span>
              </div>
              <button type="button" onClick={() => setEditingAdmin(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap / Gelar Redaksi
              </label>
              <input
                type="text"
                required
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Role Jabatan
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Redaktur Pelaksana">Redaktur Pelaksana</option>
                  <option value="Editor">Editor</option>
                  <option value="Jurnalis">Jurnalis</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Ganti Password Baru (Kosongkan jika tidak ingin mengubah)
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Masukkan password baru jika ingin diganti..."
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.88rem', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="editIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
              />
              <label htmlFor="editIsActive" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }}>
                Status Akun Aktif (Dapat Login)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{ padding: '8px 24px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.85rem', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? 'Menyimpan...' : 'Perbarui Akun'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
