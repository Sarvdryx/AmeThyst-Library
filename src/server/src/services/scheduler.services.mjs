import cron from 'node-cron';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const activeChildren = new Set();
const __dirname = path.dirname(__filename);

// Paths configuration
const ROOT_DIR = path.resolve(__dirname, '../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'server/logs');
const LOG_FILE = path.join(LOGS_DIR, 'recommendation_retraining.log');
const STATUS_FILE = path.join(LOGS_DIR, 'retrain_status.json');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

let retrainStatus = {
  lastRetrainedAt: null,
  status: 'idle',
  lastRunDurationSeconds: 0,
  logs: []
};

// Load persisted status if it exists
if (fs.existsSync(STATUS_FILE)) {
  try {
    retrainStatus = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to parse retrain status file:', err);
  }
}

const saveStatus = () => {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(retrainStatus, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save retrain status file:', err);
  }
};

const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  
  // Keep last 100 logs in memory
  retrainStatus.logs.push(`${timestamp}: ${message}`);
  if (retrainStatus.logs.length > 100) {
    retrainStatus.logs.shift();
  }
  saveStatus();
};

const runPythonScript = (scriptRelativePath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ROOT_DIR, scriptRelativePath);
    const pythonCmd = process.env.PYTHON_COMMAND || 'python';
    
    writeLog(`Spawning subprocess: ${pythonCmd} ${scriptRelativePath}`);
    const processInstance = spawn(pythonCmd, [scriptPath], {
      cwd: ROOT_DIR,
      env: { ...process.env, PYTHONPATH: ROOT_DIR }
    });
    activeChildren.add(processInstance);
    
    let output = '';
    let errorOutput = '';
    
    processInstance.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    processInstance.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    processInstance.on('close', (code) => {
      activeChildren.delete(processInstance);
      if (code === 0) {
        writeLog(`Script ${scriptRelativePath} completed successfully.`);
        resolve(output);
      } else {
        const errMsg = `Script ${scriptRelativePath} failed with exit code ${code}. Error: ${errorOutput}`;
        writeLog(errMsg);
        reject(new Error(errMsg));
      }
    });
  });
};

export const stopSchedulerChildren = () => {
  for (const child of activeChildren) {
    if (!child.killed) child.kill('SIGTERM');
  }
  activeChildren.clear();
};

export const getRetrainStatus = () => {
  return retrainStatus;
};

export const triggerRetraining = async () => {
  if (retrainStatus.status === 'running') {
    writeLog('Retraining is already running. Trigger skipped.');
    return retrainStatus;
  }
  
  const startTime = Date.now();
  retrainStatus.status = 'running';
  saveStatus();
  
  writeLog('=== Starting AI Recommendation Retraining Pipeline ===');
  
  try {
    // Stage 1: Retrain GraphSAGE representation on Memgraph
    writeLog('Starting Stage 1: GraphSAGE representation retraining...');
    await runPythonScript('database/Init_data/GraphSAGE.py');
    
    // Stage 2: Retrain LightGBM Ranker model
    writeLog('Starting Stage 2: LightGBM GBDT model retraining...');
    await runPythonScript('database/Init_data/LightGBM.py');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    retrainStatus.status = 'idle';
    retrainStatus.lastRetrainedAt = new Date().toISOString();
    retrainStatus.lastRunDurationSeconds = parseFloat(duration);
    writeLog(`=== AI Recommendation Retraining Pipeline Completed Successfully in ${duration}s ===`);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    retrainStatus.status = 'failed';
    retrainStatus.lastRunDurationSeconds = parseFloat(duration);
    writeLog(`=== AI Recommendation Retraining Pipeline Failed after ${duration}s. Error: ${error.message} ===`);
  }
  
  return retrainStatus;
};

export const initScheduler = () => {
  const cronPattern = process.env.RECOMMENDATION_RETRAIN_CRON || '0 2 * * 0'; // Default: Sunday 2:00 AM
  
  writeLog(`Initializing recommendation retraining cron scheduler with pattern: "${cronPattern}"`);
  
  cron.schedule(cronPattern, async () => {
    writeLog('Scheduled cron trigger fired. Running pipeline...');
    try {
      await triggerRetraining();
    } catch (err) {
      console.error('Error during scheduled retraining:', err);
    }
  });
};
