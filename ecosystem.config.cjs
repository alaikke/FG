module.exports = {
  apps: [{
    name: 'fastgram-api',
    script: 'dist/server.js',
    cwd: '/var/www/fastgram/backend',
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3333
    }
  }]
};
