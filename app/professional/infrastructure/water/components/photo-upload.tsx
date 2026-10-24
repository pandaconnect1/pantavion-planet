"use client";

import { useState, useRef } from "react";

interface Photo {
  id?: string;
  url: string;
  type: "damage" | "excavation" | "before" | "after" | "other";
  fileName: string;
  preview?: string;
}

interface PhotoUploadProps {
  faultId?: string;
  onChange?: (photos: Photo[]) => void;
  disabled?: boolean;
}

export function PhotoUpload({
  faultId,
  onChange,
  disabled = false,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();

        reader.onload = async (e) => {
          const base64 = (e.target?.result as string)?.split(",")[1];
          if (!base64) return;

          // Create photo object
          const newPhoto: Photo = {
            url: "",
            type: "other",
            fileName: file.name,
            preview: e.target?.result as string,
          };

          // If faultId exists, upload to server
          if (faultId) {
            try {
              const response = await fetch(
                "/api/professional/infrastructure/water/photos",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    faultId,
                    base64Data: base64,
                    fileName: file.name,
                    mimeType: file.type,
                    photoType: "other",
                  }),
                }
              );

              if (!response.ok) throw new Error("Upload failed");

              const data = await response.json();
              newPhoto.id = data.photo.id;
              newPhoto.url = data.url;
            } catch (err) {
              setError(`Failed to upload ${file.name}`);
              return;
            }
          }

          setPhotos((prev) => [...prev, newPhoto]);
          if (onChange) onChange([...photos, newPhoto]);
        };

        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError("Failed to process files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    const photo = photos[index];

    if (photo.id && faultId) {
      try {
        await fetch(
          `/api/professional/infrastructure/water/photos?photoId=${photo.id}&filePath=faults/${faultId}`,
          { method: "DELETE" }
        );
      } catch (err) {
        console.error("Failed to delete photo on server");
      }
    }

    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (onChange) onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📸 Φωτογραφίες Βλάβης
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
          >
            {uploading ? "Μεταφόρτωση..." : "✚ Προσθήκη Φωτογραφίας"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />

          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Άλλο</option>
            <option>Ζημιά</option>
            <option>Εκσκαφή</option>
            <option>Πριν</option>
            <option>Μετά</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
            >
              {photo.preview || photo.url ? (
                <img
                  src={photo.preview || photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs text-center px-2">
                    {photo.fileName}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <button
                  onClick={() => handleRemove(idx)}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                  title="Διαγραφή"
                >
                  ✕
                </button>
              </div>

              <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {photo.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          Καμία φωτογραφία προστέθηκε ακόμα
        </p>
      )}

      <p className="text-xs text-gray-500">
        Υποστηρίζονται: JPG, PNG, WebP • Max 10MB ανά φωτο
      </p>
    </div>
  );
}
