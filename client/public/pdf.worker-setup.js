/**
 * PDF.js Worker Setup Helper
 * 
 * This script helps load the PDF.js worker file in environments where dynamic imports
 * might be problematic. It's loaded as a regular script in index.html.
 */

// This will be replaced with the actual version during build
const PDFJS_VERSION = '5.2.133';

// Function to check if a worker is already configured
function isPdfWorkerConfigured() {
  try {
    return window.pdfjsLib && 
           window.pdfjsLib.GlobalWorkerOptions && 
           window.pdfjsLib.GlobalWorkerOptions.workerSrc;
  } catch (e) {
    return false;
  }
}

// Function to configure the worker
function configurePdfWorker() {
  if (isPdfWorkerConfigured()) {
    console.log('PDF.js worker already configured');
    return;
  }
  
  try {
    // Try local worker first
    const localWorkerPath = '/assets/pdf.worker.min.js';
    console.log('Setting up PDF.js worker with path:', localWorkerPath);
    
    // Store the path for later use
    window.PDFJS_WORKER_SRC = localWorkerPath;
    
    // If pdfjsLib is already loaded, configure it directly
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = localWorkerPath;
    }
  } catch (error) {
    console.warn('Error setting up PDF.js worker:', error);
    
    // Fallback to CDN
    const cdnWorkerUrl = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
    console.log('Falling back to CDN worker:', cdnWorkerUrl);
    
    // Store the path for later use
    window.PDFJS_WORKER_SRC = cdnWorkerUrl;
    
    // If pdfjsLib is already loaded, configure it directly
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
    }
  }
}

// Run the configuration
configurePdfWorker();

// Export a function to get the worker URL
window.getPdfWorkerSrc = function() {
  return window.PDFJS_WORKER_SRC || 
    `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
}; 