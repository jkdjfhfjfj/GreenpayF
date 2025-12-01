const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'dyzalgxnu',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imagePath = 'attached_assets/6c784972cbf5806215d46fbda8b0c46a_1764598543893.jpg';

cloudinary.uploader.upload(imagePath, {
  folder: 'greenpay/widgets',
  public_id: 'whatsapp-button',
  overwrite: true
}, (error, result) => {
  if (error) {
    console.error('Upload error:', error);
    process.exit(1);
  }
  console.log('Upload successful:', result.secure_url);
});
