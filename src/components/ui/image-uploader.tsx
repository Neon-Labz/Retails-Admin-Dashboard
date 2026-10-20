"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, Pencil } from "lucide-react";
import { useToast } from "./toast";
import { DEFAULT_FOLDER_DIMENSIONS, resizeImageToTarget } from "@/lib/image-utils";

export function ImageUploader({
  images,
  onChange,
  folder = "products",
  max = 6,
  hideHint,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  max?: number;
  hideHint?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const isSingleReplace = max === 1;
    const remaining = isSingleReplace ? 1 : max - images.length;
    if (remaining <= 0) {
      toast.error(`You can upload a maximum of ${max} images`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const config = folder ? DEFAULT_FOLDER_DIMENSIONS[folder] : undefined;
      const uploaded: string[] = [];
      for (let file of selected) {
        if (config) {
          try {
            file = await resizeImageToTarget(file, config.width, config.height);
          } catch (err) {
            console.warn("Resize failed, using original:", err);
          }
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");
        uploaded.push(json.data.url);
      }
      onChange(isSingleReplace ? uploaded : [...images, ...uploaded]);
      toast.success("Image(s) uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  const shouldHideHint = hideHint ?? max === 1;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={img + idx} className="group relative h-24 w-24">
            <div className="h-full w-full overflow-hidden rounded-lg border border-slate-200">
              <Image src={img} alt={`Product ${idx + 1}`} width={96} height={96} unoptimized className="h-full w-full object-cover" />
            </div>
            {max === 1 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                title="Change image"
                className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-brand hover:bg-brand hover:text-white cursor-pointer"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand hover:text-brand"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[11px]">{uploading ? "Uploading" : "Add image"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {!shouldHideHint && (
        <p className="mt-2 text-xs text-slate-400">
          {folder && DEFAULT_FOLDER_DIMENSIONS[folder]?.hint
            ? DEFAULT_FOLDER_DIMENSIONS[folder].hint
            : `PNG, JPG up to 5MB each. Max ${max} images.`}
        </p>
      )}
    </div>
  );
}
