require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadsDir = path.join(__dirname, 'public', 'uploads');

async function uploadImage(filePath, folder) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            use_filename: true,
            unique_filename: false,
            overwrite: false
        });
        console.log(`Uploaded: ${filePath} -> ${result.secure_url}`);
    } catch (error) {
        console.error(`Failed to upload ${filePath}:`, error.message);
    }
}

function walk(dir, cloudFolder) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const newCloudFolder = cloudFolder ? `${cloudFolder}/${file}` : file;
            walk(fullPath, newCloudFolder);
        } else if (/\.(jpe?g|png|gif|webp)$/i.test(file)) {
            // If cloudFolder is empty (root of uploads), map to a default folder or keep empty if you want root
            // But usually we want to mirror the structure.
            // If the file is directly in uploads, let's put it in 'uploads' folder in Cloudinary or just 'home'
            // The current app structure has 'uploads/About', 'uploads/portfolio/...'
            // Files directly in 'uploads' seem to be used for Home page.
            const targetFolder = cloudFolder || 'home_gallery';
            uploadImage(fullPath, targetFolder);
        }
    }
}

console.log('Starting migration to Cloudinary...');
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('Error: Cloudinary credentials not found in .env');
    process.exit(1);
}

walk(uploadsDir, '');
