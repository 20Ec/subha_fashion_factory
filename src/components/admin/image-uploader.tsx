"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FlowerMark } from "@/components/ui/logo";

export type UploadedImage = {
  image_url: string;
  public_id: string | null;
};

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  error?: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

async function uploadFile(file: File): Promise<UploadedImage> {
  const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });

  if (!signResponse.ok) {
    const payload = (await signResponse.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Could not prepare the upload");
  }

  const sign = (await signResponse.json()) as SignResponse;
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder);
  body.append("signature", sign.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body }
  );

  const uploaded = (await uploadResponse.json().catch(() => null)) as
    | { secure_url?: string; public_id?: string; error?: { message?: string } }
    | null;

  if (!uploadResponse.ok || !uploaded?.secure_url) {
    throw new Error(uploaded?.error?.message ?? "Image upload failed");
  }

  return {
    image_url: uploaded.secure_url,
    public_id: uploaded.public_id ?? null,
  };
}

export function ImageUploader({
  images,
  onChange,
  multiple = true,
  hint,
  className,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selected = multiple ? Array.from(files) : [files[0]];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of selected) {
        uploaded.push(await uploadFile(file));
      }
      onChange(multiple ? [...images, ...uploaded] : uploaded.slice(0, 1));
      toast.success(
        uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(images.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={`${image.image_url}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-blush"
          >
            <Image
              src={image.image_url}
              alt={`Upload ${index + 1}`}
              fill
              sizes="(max-width: 640px) 30vw, 140px"
              className="object-cover"
            />
            {index === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-navy/80 px-2 py-0.5 text-[9px] font-medium text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-rose-600 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-navy/20 bg-white text-ink transition hover:border-blue/50 hover:text-blue",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[10px]">Uploading…</span>
            </>
          ) : images.length === 0 ? (
            <>
              <FlowerMark className="h-6 w-6 text-deep-rose" />
              <span className="text-[10px] font-medium">Add photo</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Add more</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="mt-2 text-[11px] text-ink">
        {hint ??
          (multiple
            ? "The first image is used as the cover. JPG, PNG or WebP up to 10 MB."
            : "JPG, PNG or WebP up to 10 MB.")}
      </p>
    </div>
  );
}
