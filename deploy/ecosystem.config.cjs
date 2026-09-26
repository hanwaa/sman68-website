/**
 * PM2 — jalankan app Next.js di VPS.
 * Pakai dari root repo: pm2 start deploy/ecosystem.config.cjs
 *
 * Port 30000 = port yang di-assign Webuzo Application Manager; vhost domain
 * di-generate Webuzo dengan ProxyPass ke port ini.
 */
const path = require("node:path");
const APP_PORT = process.env.APP_PORT || "30000";

module.exports = {
  apps: [
    {
      name: "sman68",
      cwd: path.resolve(__dirname, ".."),
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${APP_PORT}`,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1500M",
      time: true,
      merge_logs: true,
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      env: {
        NODE_ENV: "production",
        PORT: APP_PORT,
        UV_THREADPOOL_SIZE: "8",
      },
    },
  ],
};
