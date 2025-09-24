// cluster.js - Dynamic clustering for optimal VPS performance
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster || cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  
  // Smart worker calculation based on CPU and memory
  const WORKER_COUNT = (() => {
    // For your current VPS and future upgrades
    if (numCPUs <= 2) return numCPUs;                    // 1-2 CPUs: Use all cores
    if (numCPUs <= 4) return numCPUs - 1;                // 3-4 CPUs: Leave 1 for system
    if (numCPUs <= 8) return Math.floor(numCPUs * 0.75); // 5-8 CPUs: Use 75%
    return Math.floor(numCPUs * 0.6);                    // 9+ CPUs: Use 60%
  })();
  
  // Calculate expected memory per worker
  const memoryPerWorker = Math.floor(totalMemoryGB / WORKER_COUNT * 0.8); // 80% of available memory
  
  console.log('🚀 ========================================');
  console.log('🎯 PRINTIFY SERVER CLUSTER STARTING');
  console.log('🚀 ========================================');
  console.log(`💻 VPS Specifications:`);
  console.log(`   └─ CPU Cores: ${numCPUs}`);
  console.log(`   └─ Total Memory: ${totalMemoryGB}GB`);
  console.log(`   └─ Node.js Version: ${process.version}`);
  console.log(`⚡ Cluster Configuration:`);
  console.log(`   └─ Optimal Workers: ${WORKER_COUNT}`);
  console.log(`   └─ CPU Utilization: ${Math.round((WORKER_COUNT/numCPUs)*100)}%`);
  console.log(`   └─ Memory per Worker: ~${memoryPerWorker}GB`);
  console.log(`   └─ Master PID: ${process.pid}`);
  console.log('🚀 ========================================');
  
  // Fork workers
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = cluster.fork({
      WORKER_ID: i + 1,
      WORKER_COUNT: WORKER_COUNT
    });
    
    worker.on('online', () => {
      console.log(`✅ Worker ${worker.process.pid} is online (Core ${i + 1})`);
    });
    
    worker.on('listening', (address) => {
      console.log(`🎧 Worker ${worker.process.pid} listening on ${address.address}:${address.port}`);
    });
  }
  
  // Performance monitoring
  let workerRestarts = 0;
  
  // Handle worker exit and restart
  cluster.on('exit', (worker, code, signal) => {
    workerRestarts++;
    const exitReason = signal || code;
    
    console.log(`💀 Worker ${worker.process.pid} died (${exitReason})`);
    console.log(`📊 Total worker restarts: ${workerRestarts}`);
    
    // Restart worker if not intentional shutdown
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`🔄 Restarting worker...`);
      const newWorker = cluster.fork({
        WORKER_ID: worker.id,
        WORKER_COUNT: WORKER_COUNT
      });
      console.log(`✨ New worker ${newWorker.process.pid} started`);
    }
  });
  
  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    console.log(`⏳ Disconnecting ${WORKER_COUNT} workers...`);
    
    // Disconnect all workers
    for (const id in cluster.workers) {
      cluster.workers[id].disconnect();
    }
    
    // Force kill workers after timeout
    setTimeout(() => {
      console.log('⚡ Force killing remaining workers...');
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 10000);
  };
  
  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Performance reporting every 5 minutes
  setInterval(() => {
    const activeWorkers = Object.keys(cluster.workers).length;
    const memUsage = process.memoryUsage();
    
    console.log('📊 ========================================');
    console.log('📈 CLUSTER PERFORMANCE REPORT');
    console.log('📊 ========================================');
    console.log(`⚡ Active Workers: ${activeWorkers}/${WORKER_COUNT}`);
    console.log(`🔄 Total Restarts: ${workerRestarts}`);
    console.log(`💾 Master Memory: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    console.log(`⏰ Uptime: ${Math.round(process.uptime() / 60)} minutes`);
    console.log('📊 ========================================');
  }, 5 * 60 * 1000); // Every 5 minutes
  
} else {
  // Worker process
  const workerId = process.env.WORKER_ID || 'unknown';
  const workerCount = process.env.WORKER_COUNT || 'unknown';
  
  console.log(`👷 Worker ${process.pid} starting (${workerId}/${workerCount})`);
  
  // Load the main server
  require('./server.js');
  
  // Worker-specific performance monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.rss > 500 * 1024 * 1024) { // Alert if over 500MB
      console.warn(`⚠️  Worker ${process.pid} high memory usage: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    }
  }, 2 * 60 * 1000); // Every 2 minutes
}

module.exports = cluster;
