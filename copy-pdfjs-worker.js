/**
 * Script to copy the PDF.js worker file to the public/assets directory
 * Run this before building the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const sourceWorkerPath = path.join(
  __dirname, 
  'node_modules', 
  'pdfjs-dist', 
  'build', 
  'pdf.worker.min.mjs'
);

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory: ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

const targetWorkerPath = path.join(assetsDir, 'pdf.worker.min.js');

// Copy the worker file
try {
  console.log(`Copying PDF.js worker from: ${sourceWorkerPath}`);
  console.log(`To: ${targetWorkerPath}`);
  
  fs.copyFileSync(sourceWorkerPath, targetWorkerPath);
  console.log('PDF.js worker copied successfully');
} catch (error) {
  console.error('Error copying PDF.js worker:', error);
  process.exit(1);
} 