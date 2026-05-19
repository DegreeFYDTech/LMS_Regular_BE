module.exports = {
  apps: [
    {
      name: 'regular_lms_cu_bot',
      script: './cu_bot/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
