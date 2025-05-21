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

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory: ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Define possible paths for the worker file
const possiblePaths = [
  // PDF.js v4.x paths
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
  // PDF.js v3.x paths
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js'),
  // Legacy paths
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js'),
  // PDF.js v2.x paths
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'webpack', 'pdf.worker.min.js'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'webpack', 'pdf.worker.js')
];

// Try to find and copy the worker file
let copied = false;

for (const sourcePath of possiblePaths) {
  if (fs.existsSync(sourcePath)) {
    try {
      // Determine target filename based on source
      const isMinified = sourcePath.includes('.min.');
      const extension = sourcePath.endsWith('.mjs') ? '.mjs' : '.js';
      const targetName = `pdf.worker${isMinified ? '.min' : ''}${extension}`;
      const targetPath = path.join(assetsDir, targetName);
      
      console.log(`Found worker file at: ${sourcePath}`);
      console.log(`Copying to: ${targetPath}`);
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log('PDF.js worker copied successfully');
      copied = true;
      break;
    } catch (error) {
      console.error(`Error copying from ${sourcePath}:`, error);
    }
  }
}

if (!copied) {
  console.error('Could not find or copy the PDF.js worker file from any known location');
  console.error('Please check your pdfjs-dist installation');
  process.exit(1);
} 