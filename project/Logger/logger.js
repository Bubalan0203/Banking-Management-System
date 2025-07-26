// logger.js
import fs from 'fs';
import path from 'path';

const logDir = path.resolve('logs');  // folder: /logs
const logFilePath = path.join(logDir, 'api.log');  // file: /logs/api.log

// ✅ Auto-create the folder if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error('❌ Failed to write to log file:', err);
  });
}
