const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to generate a URL for PDF delivery
const getSignedUrl = (publicId, options = {}) => {
  // Create URL options for better PDF accessibility
  const defaultOptions = {
    resource_type: 'raw',
    type: 'upload',
    format: 'pdf',
    flags: 'attachment:false',  // Don't force download
    disposition: 'inline',       // Display in browser
    secure: true,
    sign_url: true
  };

  const finalOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, finalOptions);
};

// Helper function to create a local proxy URL
const getProxyUrl = (publicId) => {
  // Extract just the path part from the public ID
  const cleanId = publicId.replace('printify/pdfs/', '');
  return `/pdf-proxy/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${cleanId}.pdf`;
};

module.exports = { cloudinary, getSignedUrl, getProxyUrl }; 