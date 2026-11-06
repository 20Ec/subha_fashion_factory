import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function destroyCloudinaryImages(
  publicIds: (string | null | undefined)[]
) {
  const ids = publicIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0 || !isCloudinaryConfigured()) return;
  configure();
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
}
