import * as pdfjs from 'pdfjs-dist';

// Configure the worker source with multiple fallback options
const configurePdfWorker = () => {
  // Check if we already have a global worker configuration from pdf.worker-setup.js
  if (window.PDFJS_WORKER_SRC) {
    console.log('Using pre-configured PDF.js worker from global setup:', window.PDFJS_WORKER_SRC);
    pdfjs.GlobalWorkerOptions.workerSrc = window.PDFJS_WORKER_SRC;
    return;
  }
  
  // If no global configuration exists, try our own approaches
  try {
    // Try to use the Vite-specific approach first
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    
    console.log('Setting PDF.js worker URL:', workerUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (error) {
    console.warn('Error setting up PDF.js worker with import.meta.url:', error);
    
    // Fallback 1: Try using relative path
    try {
      const workerRelativePath = '/assets/pdf.worker.min.js';
      console.log('Falling back to relative worker path:', workerRelativePath);
      pdfjs.GlobalWorkerOptions.workerSrc = workerRelativePath;
    } catch (fallbackError) {
      console.warn('Error with fallback worker path:', fallbackError);
      
      // Fallback 2: Use CDN as last resort
      const cdnWorkerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      console.log('Using CDN worker as last resort:', cdnWorkerUrl);
      pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
    }
  }
};

// Initialize the worker
configurePdfWorker();

// Export the worker source for other components to use
export const pdfWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc;

/**
 * Get the page count of a PDF file using multiple methods
 * @param {File|Blob|string} pdfSource - The PDF file, blob, or URL
 * @returns {Promise<number>} - The number of pages
 */
export async function getPdfPageCount(pdfSource) {
  console.log('Getting PDF page count for:', typeof pdfSource);
  
  // Try multiple methods in sequence
  try {
    // Method 1: Direct loading
    try {
      const loadingTask = pdfjs.getDocument(pdfSource);
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      console.log(`PDF loaded successfully. Total pages: ${pageCount}`);
      return pageCount;
    } catch (directError) {
      console.warn('Direct PDF loading failed, trying next method:', directError);
    }
    
    // Method 2: ArrayBuffer loading
    if (pdfSource instanceof File || pdfSource instanceof Blob) {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(pdfSource);
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;
        console.log(`PDF loaded with ArrayBuffer method. Total pages: ${pageCount}`);
        return pageCount;
      } catch (bufferError) {
        console.warn('ArrayBuffer loading failed, trying next method:', bufferError);
      }
    }
    
    // Method 3: Data URL loading
    if (pdfSource instanceof File || pdfSource instanceof Blob) {
      try {
        const dataUrl = await readFileAsDataURL(pdfSource);
        const loadingTask = pdfjs.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;
        console.log(`PDF loaded with Data URL method. Total pages: ${pageCount}`);
        return pageCount;
      } catch (dataUrlError) {
        console.warn('Data URL loading failed, trying manual extraction:', dataUrlError);
      }
    }
    
    // Method 4: Manual extraction as last resort
    if (pdfSource instanceof File || pdfSource instanceof Blob) {
      try {
        const pageCount = await extractPageCountManually(pdfSource);
        if (pageCount > 0) {
          console.log(`Manually extracted page count: ${pageCount}`);
          return pageCount;
        }
      } catch (manualError) {
        console.error('Manual extraction failed:', manualError);
      }
    }
    
    // If all methods fail, return default
    console.warn('All page counting methods failed, returning default of 1');
    return 1;
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    return 1;
  }
}

/**
 * Read a file as ArrayBuffer
 * @param {File|Blob} file - The file to read
 * @returns {Promise<ArrayBuffer>} - The file contents as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file as Data URL
 * @param {File|Blob} file - The file to read
 * @returns {Promise<string>} - The file contents as Data URL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file as Data URL'));
    reader.readAsDataURL(file);
  });
}

/**
 * Manually extract page count from PDF
 * @param {File|Blob} file - The PDF file
 * @returns {Promise<number>} - The extracted page count or 1 if extraction fails
 */
async function extractPageCountManually(file) {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const data = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(data);
    
    // Try multiple regex patterns for different PDF structures
    const patterns = [
      /\/N\s+(\d+)/, // Common pattern
      /\/Count\s+(\d+)/, // Alternative pattern
      /\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/ // More specific pattern
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        const pageCount = parseInt(matches[1], 10);
        if (pageCount > 0) {
          return pageCount;
        }
      }
    }
    
    return 1; // Default fallback
  } catch (error) {
    console.error('Error in manual page extraction:', error);
    return 1;
  }
} 