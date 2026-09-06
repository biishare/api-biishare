"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPublicationMediaToCloudinary = exports.uploadProfileImageToCloudinary = exports.detectPublicationMediaKind = void 0;
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
const getBaseName = (fileName) => fileName.replace(/\.[^.]+$/, "").trim() || "Ficheiro";
const countPdfPages = (buffer) => {
    var _a;
    const text = buffer.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, (_a = matches === null || matches === void 0 ? void 0 : matches.length) !== null && _a !== void 0 ? _a : 1);
};
const detectPublicationMediaKind = (file) => {
    const mimetype = file.mimetype.toLowerCase();
    const name = file.originalname.toLowerCase();
    if (mimetype.startsWith("image/")) {
        return "image";
    }
    if (mimetype.startsWith("video/")) {
        return "video";
    }
    if (mimetype === "application/pdf" || name.endsWith(".pdf")) {
        return "document";
    }
    return null;
};
exports.detectPublicationMediaKind = detectPublicationMediaKind;
const getPublicationResourceType = (type) => type === "video" ? "video" : "image";
const getPublicationThumbnailUrl = ({ publicId, type, }) => {
    if (type === "image") {
        return cloudinary_1.v2.url(publicId, {
            secure: true,
            resource_type: "image",
            transformation: [
                { width: 1280, height: 720, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" },
            ],
        });
    }
    if (type === "document") {
        return cloudinary_1.v2.url(publicId, {
            secure: true,
            resource_type: "image",
            transformation: [
                { page: 1, width: 1280, crop: "fit", quality: "auto", fetch_format: "auto" },
            ],
        });
    }
    return cloudinary_1.v2.url(publicId, {
        secure: true,
        resource_type: "video",
        format: "jpg",
        transformation: [
            { width: 1280, height: 720, crop: "fill", gravity: "auto", quality: "auto" },
        ],
    });
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
const uploadPublicationMediaToCloudinary = async ({ file, userId, }) => {
    ensureCloudinaryConfig();
    const type = (0, exports.detectPublicationMediaKind)(file);
    if (!type) {
        throw new Error("Tipo de ficheiro nao suportado.");
    }
    const resourceType = getPublicationResourceType(type);
    const options = {
        folder: `biishare/publications/${userId}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
    };
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
            if (error || !result) {
                reject(error || new Error("Upload Cloudinary sem resultado."));
                return;
            }
            resolve(result);
        });
        stream.end(file.buffer);
    });
    const url = uploadResult.secure_url || cloudinary_1.v2.url(uploadResult.public_id, {
        secure: true,
        resource_type: resourceType,
    });
    const response = {
        type,
        url,
        thumbnailUrl: getPublicationThumbnailUrl({ publicId: uploadResult.public_id, type }),
        originalName: file.originalname,
        title: getBaseName(file.originalname),
        bytes: file.size,
    };
    if (type === "document") {
        response.totalPages = countPdfPages(file.buffer);
    }
    return response;
};
exports.uploadPublicationMediaToCloudinary = uploadPublicationMediaToCloudinary;
