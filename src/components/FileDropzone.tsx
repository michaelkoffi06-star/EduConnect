'use client';

import { useEffect, useRef, useState } from 'react';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function FileDropzone({
  label,
  hint,
  accept,
  file,
  onChange,
  showImagePreview,
  emptyLabel = 'Cliquez ou glissez un fichier ici',
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  showImagePreview?: boolean;
  emptyLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (showImagePreview && file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file, showImagePreview]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition ${
          dragOver ? 'border-[#c9951a] bg-[#c9951a]/5' : file ? 'border-[#c9951a]/50 bg-[#faf8f2]' : 'border-gray-300 hover:border-[#c9951a]/50 hover:bg-[#faf8f2]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        {showImagePreview && previewUrl ? (
          <img src={previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${file ? 'bg-[#c9951a] text-white' : 'bg-gray-100 text-gray-400'}`}>
            {file ? '✓' : '⬆'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="text-sm font-medium text-[#0d1b3e] truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatSize(file.size)} — cliquez pour changer</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">{emptyLabel}</p>
              <p className="text-xs text-gray-400">{hint}</p>
            </>
          )}
        </div>

        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-gray-400 hover:text-red-500 text-lg shrink-0"
            aria-label="Retirer le fichier"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
