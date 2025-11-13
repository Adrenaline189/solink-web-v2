module.exports = {
  apps: [
    {
      name: "solink-web",
      cwd: "./",
      script: "node_modules/.bin/next",
      args: "start -p ${PORT:-3000}",
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      watch: false,
      max_restarts: 20,
      restart_delay: 2000,
      kill_timeout: 8000,
      env_production: { NODE_ENV: "production" }
    },
    {
      name: "rollup-worker",
      cwd: "./",
      // ให้ tsx เป็น interpreter แล้วชี้ไปที่ไฟล์ .ts
      interpreter: "node_modules/.bin/tsx",
      script: "scripts/rollup-worker.ts",
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      watch: false,
      max_restarts: 50,
      restart_delay: 2000,
      kill_timeout: 8000
    }
  ]
}
