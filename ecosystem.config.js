module.exports = {
  apps: [
    {
      name: "solink-web",
      script: "node_modules/.bin/next",
      args: "dev",
      env: { PORT: 3000 }
      // production: ใช้ script: "node_modules/.bin/next", args: "start"
    },
    {
      name: "rollup-worker",
      script: "node_modules/.bin/tsx",
      args: "scripts/rollup-worker.ts",
      env: {
        NODE_OPTIONS: "--max-old-space-size=512",
        ...process.env
      }
    },
    {
      name: "auto-loop",
      script: "node",
      args: "scripts/auto-loop.mjs",
      env: { ...process.env }
    }
  ]
}
