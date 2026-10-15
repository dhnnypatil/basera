/**
 * Image upload setup (multer).
 *
 * - If Cloudinary keys are present in .env, images are uploaded to Cloudinary.
 * - Otherwise they are saved on disk in public/uploads (good enough for local demos).
 *
 * Either way, controllers read `req.file.path` (the image URL) and `req.file.filename`.
 */
const path = require("path");
const multer = require("multer");

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function buildCloudinaryStorage() {
    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");

    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET,
    });

    return new CloudinaryStorage({
        cloudinary,
        params: { folder: "basera", allowedFormats: ["png", "jpg", "jpeg", "webp"] },
    });
}

function buildDiskStorage() {
    return multer.diskStorage({
        destination: path.join(__dirname, "..", "public", "uploads"),
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        },
    });
}

const useCloudinary = Boolean(process.env.CLOUD_NAME);
const storage = useCloudinary ? buildCloudinaryStorage() : buildDiskStorage();

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.includes(file.mimetype)),
});

/** Turns the uploaded file into the { url, filename } shape our Listing model expects. */
function fileToImage(file) {
    if (!file) return null;
    const url = useCloudinary ? file.path : `/uploads/${file.filename}`;
    return { url, filename: file.filename };
}

module.exports = { upload, fileToImage };
