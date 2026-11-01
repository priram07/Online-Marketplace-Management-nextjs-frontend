"use client";

import { useRef, useState } from "react";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { resolveImageUrl } from "@/lib/types";

type ImageUploaderProps = {
  value?: string;
  onChange: (url: string) => void;
};

// Wraps POST /uploads/image (multipart/form-data, field name "image"),
// the endpoint the backend exposes so sellers can attach real photos
// to a listing instead of a free-text URL. Auth is via the same
// Authorization header lib/api.ts already attaches — UploaderAuthGuard
// on the backend accepts a seller or admin JWT.
export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Axios call — POST /uploads/image
      const { data } = await sellerApi.post<{ url: string }>("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onChange(data.url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Image upload failed. Try a smaller JPG/PNG/WEBP."));
    } finally {
      setIsUploading(false);
    }
  }

  const preview = resolveImageUrl(value);

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-paper-dim">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-ink/35">No image</span>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading..." : preview ? "Change image" : "Upload image"}
          </button>
          <p className="mt-1 text-xs text-ink/45">JPG, PNG, WEBP or GIF, up to 5MB.</p>
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
