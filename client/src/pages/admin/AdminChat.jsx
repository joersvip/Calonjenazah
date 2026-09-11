import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Users, Circle, Trash2, 
  Smile, RefreshCw, Shield, Clock, AlertCircle
} from 'lucide-react';
import { getSocket } from '../../services/telemetry';

const ROLE_COLORS = {
  'Super Admin': { bg: 'rgba(230, 57, 70, 0.2)', text: '#ff858d', border: 'rgba(230, 57, 70, 0.4)' },
  'Redaktur Pelaksana': { bg: 'rgba(212, 175, 55, 0.2)', text: 'var(--accent-gold)', border: 'rgba(212, 175, 55, 0.4)' },
  'Editor': { bg: 'rgba(157, 78, 221, 0.2)', text: '#c77dff', border: 'rgba(157, 78, 221, 0.4)' },
  'Jurnalis': { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' }
};

export default function AdminChat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [onlineAdmins, setOnlineAdmins] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);

  // Get current logged-in admin
  const currentAdmin = (() => {
    try {
      const stored = localStorage.getItem('calonjenazah_admin_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      id: 1,
      username: 'admin',
      display_name: 'Dewan Redaksi Utama',
      role: 'Super Admin'
    };
  })();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const socket = getSocket();

    // 1. Join admin chat room
    socket.emit('admin_join_chat', currentAdmin);

    // 2. Listen for online admins list
    const handleOnlineList = (admins) => {
      setOnlineAdmins(admins || []);
    };
    socket.on('admin_online_list', handleOnlineList);

    // 3. Listen for message history
    const handleHistory = (hist) => {
      setMessages(hist || []);
      setLoadingHistory(false);
      setTimeout(scrollToBottom, 100);
    };
    socket.on('admin_chat_history', handleHistory);

    // 4. Listen for new incoming messages
    const handleNewMessage = (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);
    };
    socket.on('admin_new_message', handleNewMessage);

    // Fetch initial history via REST as fallback
    fetch('/api/admin/chat/messages')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
        setLoadingHistory(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => setLoadingHistory(false));

    return () => {
      socket.off('admin_online_list', handleOnlineList);
      socket.off('admin_chat_history', handleHistory);
      socket.off('admin_new_message', handleNewMessage);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socket = getSocket();
    const cleanText = inputText.trim();

    socket.emit('admin_send_message', {
      message: cleanText
    });

    setInputText('');
  };

  const handleDeleteMessage = (msgId) => {
    if (!window.confirm('Hapus pesan ini dari ruang diskusi?')) return;

    fetch(`/api/admin/chat/messages/${msgId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages(prev => prev.filter(m => m.id !== msgId));
        }
      })
      .catch(() => {});
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div style={{
      maxWidth: '1200px',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '20px',
      height: 'calc(100vh - 120px)',
      minHeight: '600px'
    }}>
      {/* LEFT SIDEBAR: Active Online Admins */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-gold)" />
            <h3 className="display-font" style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
              Admin Online
            </h3>
          </div>
          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            borderRadius: '10px',
            fontWeight: '800'
          }}>
            {onlineAdmins.length} Aktif
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {onlineAdmins.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 10px' }}>
              Tidak ada admin lain yang sedang online.
            </div>
          ) : (
            onlineAdmins.map((adm, idx) => {
              const isMe = adm.username === currentAdmin.username;
              const roleStyle = ROLE_COLORS[adm.role] || ROLE_COLORS['Editor'];

              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: isMe ? 'rgba(230, 57, 70, 0.08)' : 'rgba(255,255,255,0.03)',
                  border: isMe ? '1px solid rgba(230, 57, 70, 0.2)' : '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: adm.role === 'Super Admin' ? 'var(--accent-crimson)' : '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.8rem'
                    }}>
                      {getInitials(adm.display_name)}
                    </div>
                    {/* Pulsing online indicator */}
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid #0c0f16'
                    }} />
                  </div>

                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {adm.display_name} {isMe && <span style={{ color: 'var(--accent-gold)', fontSize: '0.72rem' }}>(Anda)</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        fontWeight: '700'
                      }}>
                        {adm.role}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Chip Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '12px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Login Sebagai:</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
            {currentAdmin.display_name}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--accent-gold)' }}>
            @{currentAdmin.username} • {currentAdmin.role}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          background: '#090b10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-crimson), #8b0000)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(230,57,70,0.3)'
            }}>
              <MessageSquare size={20} color="#fff" />
            </div>
            <div>
              <h2 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Ruang Diskusi Internal Redaksi &amp; Admin
              </h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Koordinasi realtime peliputan, persetujuan artikel, dan investigasi berita
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Circle size={8} fill="#10b981" /> Live WebSocket
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#06080c'
        }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '0.85rem' }}>
              Memuat riwayat diskusi redaksi...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', maxWidth: '360px' }}>
              <MessageSquare size={36} color="var(--border-subtle)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                Belum Ada Pesan
              </div>
              <p style={{ fontSize: '0.78rem' }}>
                Mulai percakapan untuk berkoordinasi dengan dewan redaksi, editor, dan jurnalis yang sedang online.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_username === currentAdmin.username;
              const roleStyle = ROLE_COLORS[msg.sender_role] || ROLE_COLORS['Editor'];
              const timeFormatted = new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    gap: '10px',
                    alignItems: 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isMine ? 'var(--accent-crimson)' : '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    {getInitials(msg.sender_name)}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    background: isMine 
                      ? 'linear-gradient(135deg, rgba(230, 57, 70, 0.25), rgba(120, 15, 22, 0.3))' 
                      : 'var(--bg-surface)',
                    border: isMine ? '1px solid rgba(230, 57, 70, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    padding: '10px 14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    position: 'relative',
                    group: 'msg-group'
                  }}>
                    {/* Header info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isMine ? 'var(--accent-gold)' : '#fff' }}>
                        {isMine ? 'Anda' : msg.sender_name}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        fontWeight: '700'
                      }}>
                        {msg.sender_role}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {timeFormatted}
                      </span>

                      {/* Delete button (only for author or super admin) */}
                      {(isMine || currentAdmin.role === 'Super Admin') && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Hapus pesan"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            marginLeft: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Text Body */}
                    <div style={{
                      fontSize: '0.86rem',
                      color: '#f1f5f9',
                      lineHeight: '1.45',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} style={{
          padding: '14px 20px',
          background: '#0a0d14',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            type="text"
            placeholder={`Ketik pesan sebagai ${currentAdmin.display_name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              background: inputText.trim() ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.06)',
              color: inputText.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '0.88rem',
              boxShadow: inputText.trim() ? '0 4px 15px rgba(230,57,70,0.3)' : 'none'
            }}
          >
            <span>Kirim</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
