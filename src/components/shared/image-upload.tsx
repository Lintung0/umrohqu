"use client"

import { useState, useRef } from "react"
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type ImageUploadProps = {
  value: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
}

export function ImageUpload({ value, onChange, bucket = "packages", folder = "images" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = `${folder}/${fileName}`

      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      onChange(urlData.publicUrl)
      setPreviewError(false)
    } catch (err: any) {
      console.error("Upload error:", err)
      alert("Gagal mengupload gambar: " + (err.message || "Unknown error"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPreviewError(false) }}
          placeholder="https://contoh.com/gambar.jpg"
          className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
        />
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Upload..." : "Upload"}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>

      {value && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-gray-50">
          {previewError ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                <p className="text-xs">Gambar tidak dapat dimuat</p>
              </div>
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
              onLoad={() => setPreviewError(false)}
            />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
