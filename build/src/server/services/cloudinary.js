"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const ensureCloudinaryConfig = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary nao configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
    }
    cloudinary_1.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
};
const getDeliveryTransformation = (slot) => {
    if (slot === "avatar") {
        return [
            {
                width: 512,
                height: 512,
                crop: "fill",
                gravity: "auto",
                quality: "auto",
                fetch_format: "auto",
            },
        ];
    }
    return [
        {
            width: 1600,
            height: 500,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
            fetch_format: "auto",
        },
    ];
};
const uploadProfileImageToCloudinary = async ({ file, slot, userId, }) => {
    ensureCloudinaryConfig();
    const options = {
        folder: `biishare/users/${userId}`,
        public_id: slot,
        overwrite: true,
        resource_type: "image",
    };
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream(options, (error, uploadResult) => {
            if (error || !uploadResult) {
                reject(error || new Error("Upload Cloudinary sem resultado."));
                return;
            }
            resolve({ public_id: uploadResult.public_id });
        });
        stream.end(file.buffer);
    });
    return cloudinary_1.v2.url(result.public_id, {
        secure: true,
        transformation: getDeliveryTransformation(slot),
    });
};
exports.uploadProfileImageToCloudinary = uploadProfileImageToCloudinary;
