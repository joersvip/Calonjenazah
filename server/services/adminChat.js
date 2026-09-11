const db = require('../db');

// In-memory map of active admin sockets: socket.id -> adminUser
const activeAdminSockets = new Map();

/**
 * Setup Socket.io events for Inter-Admin Real-Time Chat
 * @param {object} io - Socket.io server instance
 */
function setupAdminChatSocket(io) {
  io.on('connection', (socket) => {
    // Admin joins the internal redaksi chat room
    socket.on('admin_join_chat', (adminUser) => {
      if (!adminUser || !adminUser.username) return;

      const adminProfile = {
        socketId: socket.id,
        id: adminUser.id || 1,
        username: adminUser.username,
        display_name: adminUser.display_name || adminUser.username,
        role: adminUser.role || 'Editor',
        avatar_url: adminUser.avatar_url || '',
        connected_at: new Date().toISOString()
      };

      activeAdminSockets.set(socket.id, adminProfile);
      socket.join('admin_chat_room');

      // Broadcast updated online admins list
      broadcastOnlineAdmins(io);

      // Send recent message history to the newly joined admin
      try {
        const history = getChatHistory(50);
        socket.emit('admin_chat_history', history);
      } catch (err) {
        console.error('Error sending chat history:', err.message);
      }
    });

    // Admin sends a message
    socket.on('admin_send_message', (payload) => {
      const sender = activeAdminSockets.get(socket.id);
      if (!sender || !payload || !payload.message || !payload.message.trim()) return;

      try {
        const cleanMsg = payload.message.trim();
        const insertStmt = db.prepare(`
          INSERT INTO admin_messages (
            sender_id, sender_username, sender_name, sender_role, sender_avatar, message, reply_to_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertStmt.run(
          sender.id,
          sender.username,
          sender.display_name,
          sender.role,
          sender.avatar_url || '',
          cleanMsg,
          payload.reply_to_id ? Number(payload.reply_to_id) : null
        );

        const newMsgObj = {
          id: result.lastInsertRowid,
          sender_id: sender.id,
          sender_username: sender.username,
          sender_name: sender.display_name,
          sender_role: sender.role,
          sender_avatar: sender.avatar_url,
          message: cleanMsg,
          reply_to_id: payload.reply_to_id ? Number(payload.reply_to_id) : null,
          created_at: new Date().toISOString()
        };

        // Broadcast to all admins in the room
        io.to('admin_chat_room').emit('admin_new_message', newMsgObj);
      } catch (error) {
        console.error('Error saving admin message:', error.message);
        socket.emit('admin_chat_error', { message: 'Gagal mengirim pesan' });
      }
    });

    // Admin disconnects
    socket.on('disconnect', () => {
      if (activeAdminSockets.has(socket.id)) {
        activeAdminSockets.delete(socket.id);
        broadcastOnlineAdmins(io);
      }
    });
  });
}

function broadcastOnlineAdmins(io) {
  // Deduplicate by username for multiple tabs of the same admin
  const uniqueAdmins = [];
  const seenUsernames = new Set();

  for (const admin of activeAdminSockets.values()) {
    if (!seenUsernames.has(admin.username)) {
      seenUsernames.add(admin.username);
      uniqueAdmins.push({
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        role: admin.role,
        avatar_url: admin.avatar_url,
        connected_at: admin.connected_at
      });
    }
  }

  io.to('admin_chat_room').emit('admin_online_list', uniqueAdmins);
}

/**
 * Get chat history from SQLite
 * @param {number} limit 
 * @returns {Array}
 */
function getChatHistory(limit = 100) {
  const rows = db.prepare(`
    SELECT id, sender_id, sender_username, sender_name, sender_role, 
           sender_avatar, message, reply_to_id, created_at
    FROM admin_messages
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  return rows.reverse();
}

/**
 * Get currently online admin users
 * @returns {Array}
 */
function getOnlineAdminsList() {
  const uniqueAdmins = [];
  const seenUsernames = new Set();

  for (const admin of activeAdminSockets.values()) {
    if (!seenUsernames.has(admin.username)) {
      seenUsernames.add(admin.username);
      uniqueAdmins.push({
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        role: admin.role,
        avatar_url: admin.avatar_url,
        connected_at: admin.connected_at
      });
    }
  }

  return uniqueAdmins;
}

module.exports = {
  setupAdminChatSocket,
  getChatHistory,
  getOnlineAdminsList
};
