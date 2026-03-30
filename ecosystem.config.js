module.exports = {
  apps: [
    {
      name: 'interview-replay-frontend',
      script: 'npm',
      args: 'run start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'interview-replay-backend',
      script: 'npm',
      args: 'run start',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'interview-replay-worker',
      script: 'npm',
      args: 'run worker',
      cwd: './backend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
