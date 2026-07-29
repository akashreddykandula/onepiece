'use strict';
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'onepiece',
      resource_type: 'auto',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      ...options,
    };
    const stream = cloudinary.uploader.upload_stream(defaultOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    const { Readable } = require('stream');
    Readable.from(buffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    return null;
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
