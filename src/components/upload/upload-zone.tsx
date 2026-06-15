"use client";

import { useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadZoneProps = {
  endpoint: string;
  label: string;
  onSuccess?: () => void;
};

export function UploadZone({ endpoint, label, onSuccess }: UploadZoneProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setMessage(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(endpoint, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setMessage(data.message ?? "TKOGON processed your upload successfully.");
        onSuccess?.();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onSuccess]
  );

  return (
    <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
      <Upload className="mx-auto h-8 w-8 text-emerald-400" />
      <p className="mt-3 text-sm text-slate-300">{label}</p>
      <label className="mt-4 inline-block">
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button type="button" variant="secondary" disabled={loading}>
          {loading ? "TKOGON is scanning..." : "Upload & scan"}
        </Button>
      </label>
      {loading && <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-emerald-400" />}
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </div>
  );
}
