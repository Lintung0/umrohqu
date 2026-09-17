const DEPLOY_PATH = "/www/wwwroot/UmrahQu-Marketplace";
const NODE_BIN = "/www/server/nvm/versions/node/v24.21.0/bin/node";
const PM2_BIN = "/www/server/nvm/versions/node/v24.21.0/bin/pm2";

module.exports = {
  apps: [
    {
      name: "UmrahQu-Marketplace",
      cwd: DEPLOY_PATH,
      script: DEPLOY_PATH + "/node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: NODE_BIN,
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/www/wwwlogs/UmrahQu-Marketplace-error.log",
      out_file: "/www/wwwlogs/UmrahQu-Marketplace-out.log",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
