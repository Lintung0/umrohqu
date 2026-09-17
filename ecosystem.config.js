module.exports = {
  apps: [
    {
      name: "UmrahQu-Marketplace",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
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
