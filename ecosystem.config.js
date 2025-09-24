// ecosystem.config.js - PM2 configuration for production deployment
const os = require('os');

const numCPUs = os.cpus().length;
const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

// Dynamic instance calculation
const instances = (() => {
  if (numCPUs <= 2) return numCPUs;
  if (numCPUs <= 4) return numCPUs - 1;
  if (numCPUs <= 8) return Math.floor(numCPUs * 0.75);
  return Math.floor(numCPUs * 0.6);
})();

// Dynamic memory allocation (80% of available memory per worker)
const memoryPerInstance = Math.floor((totalMemoryGB * 0.8 * 1024) / instances);
const maxMemoryRestart = `${Math.min(memoryPerInstance, 1024)}M`;

console.log(`🔧 PM2 Configuration:`);
console.log(`   └─ Instances: ${instances}`);
console.log(`   └─ Memory per instance: ${maxMemoryRestart}`);
console.log(`   └─ Total CPU cores: ${numCPUs}`);

module.exports = {
  apps: [{
    name: 'printify-server',
    script: 'cluster.js',
    instances: instances,
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      PM2_SERVE_PATH: '.',
      PM2_SERVE_PORT: 8080
    },
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    
    // Memory and performance settings
    max_memory_restart: maxMemoryRestart,
    node_args: `--max-old-space-size=${Math.min(memoryPerInstance, 1024)}`,
    
    // Process management
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Auto-restart configuration
    max_restarts: 5,
    min_uptime: '30s',
    restart_delay: 1000,
    
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Monitoring and health checks
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log', 'uploads', 'storage'],
    
    // Advanced PM2 features
    instance_var: 'INSTANCE_ID',
    
    // Graceful shutdown
    kill_timeout: 5000,
    shutdown_with_message: true,
    
    // Performance monitoring
    pmx: true,
    
    // Custom environment variables for workers
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080,
      CLUSTER_WORKERS: instances,
      TOTAL_MEMORY_GB: totalMemoryGB,
      MEMORY_PER_WORKER: memoryPerInstance
    }
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: ['your-vps-ip'],
      ref: 'origin/main',
      repo: 'your-git-repo',
      path: '/var/www/printify-server',
      'post-deploy': 'npm install && npm run pm2:restart && pm2 save'
    }
  }
};
