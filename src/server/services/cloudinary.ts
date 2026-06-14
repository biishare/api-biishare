import { v2 as cloudinary, UploadApiOptions } from "cloudinary";

type ProfileImageSlot = "avatar" | "cover";

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
