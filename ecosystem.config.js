module.exports = {
  apps: [
    {
      name: 'calonjenazah-portal',
      script: 'server/index.js',
      instances: 1, // Single instance recommended for SQLite & WebSocket session consistency
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
