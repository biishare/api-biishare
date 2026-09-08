import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

type ProfileImageSlot = "avatar" | "cover";
export type PublicationMediaKind = "image" | "video" | "document";

export type PublicationMediaUploadResult = {
  type: PublicationMediaKind;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  title: string;
  bytes: number;
  totalPages?: number;
  durationSeconds?: number;
};

const ensureCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary nao configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
};

const getDeliveryTransformation = (slot: ProfileImageSlot) => {
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

const getBaseName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "").trim() || "Ficheiro";

export const detectPublicationMediaKind = (file: Express.Multer.File): PublicationMediaKind | null => {
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

const getPublicationResourceType = (type: PublicationMediaKind) =>
  type === "video" ? "video" : "image";

const getPublicationThumbnailUrl = ({
  publicId,
  type,
}: {
  publicId: string;
  type: PublicationMediaKind;
}) => {
  if (type === "image") {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: "image",
      transformation: [
        { width: 1280, height: 720, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" },
      ],
    });
  }

  if (type === "document") {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: "image",
      transformation: [
        { page: 1, width: 1280, crop: "fit", quality: "auto", fetch_format: "auto" },
      ],
    } as UploadApiOptions);
  }

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "video",
    format: "jpg",
    transformation: [
      { width: 1280, height: 720, crop: "fill", gravity: "auto", quality: "auto" },
    ],
  });
};

export const uploadProfileImageToCloudinary = async ({
  file,
  slot,
  userId,
}: {
  file: Express.Multer.File;
  slot: ProfileImageSlot;
  userId: string;
}): Promise<string> => {
  ensureCloudinaryConfig();

  const options: UploadApiOptions = {
    folder: `biishare/users/${userId}`,
    public_id: slot,
    overwrite: true,
    resource_type: "image",
  };

  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Upload Cloudinary sem resultado."));
          return;
        }

        resolve({ public_id: uploadResult.public_id });
      }
    );

    stream.end(file.buffer);
  });

  return cloudinary.url(result.public_id, {
    secure: true,
    transformation: getDeliveryTransformation(slot),
  });
};

export const uploadPublicationMediaToCloudinary = async ({
  file,
  userId,
}: {
  file: Express.Multer.File;
  userId: string;
}): Promise<PublicationMediaUploadResult> => {
  ensureCloudinaryConfig();

  const type = detectPublicationMediaKind(file);

  if (!type) {
    throw new Error("Tipo de ficheiro nao suportado.");
  }

  const resourceType = getPublicationResourceType(type);
  const options: UploadApiOptions = {
    folder: `biishare/publications/${userId}`,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload Cloudinary sem resultado."));
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

  const url = uploadResult.secure_url || cloudinary.url(uploadResult.public_id, {
    secure: true,
    resource_type: resourceType,
  });

  const response: PublicationMediaUploadResult = {
    type,
    url,
    thumbnailUrl: getPublicationThumbnailUrl({ publicId: uploadResult.public_id, type }),
    originalName: file.originalname,
    title: getBaseName(file.originalname),
    bytes: file.size,
  };

  if (type === "document") {
    const pages = Number(uploadResult.pages);

    if (Number.isFinite(pages) && pages >= 1) {
      response.totalPages = Math.floor(pages);
    }
  }

  if (type === "video") {
    const duration = Number(uploadResult.duration);

    if (Number.isFinite(duration) && duration >= 0) {
      response.durationSeconds = duration;
    }
  }

  return response;
};
