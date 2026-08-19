"use client"

import { useState, useRef } from "react"
import { Upload, FileText, X, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  label: string
  accept?: string
  bucket: string
  onUpload: (url: string) => void
  onError?: (error: string) => void
  value?: string
  error?: string
  required?: boolean
  description?: string
}

const ACCEPT_MAP: Record<string, string> = {
  image: "image/jpeg,image/png,image/webp",
  document: "application/pdf",
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function FileUpload({
  label,
  accept = "document",
  bucket,
  onUpload,
  onError,
  value,
  error,
  required,
  description,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptTypes = ACCEPT_MAP[accept] || accept

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE) {
      onError?.("Ukuran file maksimal 2MB")
      return
    }

    setUploading(true)
    setFileName(file.name)

    try {
      const ext = file.name.split(".").pop()
      const path = `register/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", bucket)
      formData.append("path", path)

      const res = await fetch("/api/auth/register-travel/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal upload file")
      }

      onUpload(data.url)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Gagal upload file")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onUpload("")
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const isImage = accept === "image"
  const hasFile = !!value

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {hasFile && !uploading ? (
        <div className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-auth-primary/30 bg-auth-primary-light/50 px-4 py-3">
          {isImage ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={value}
                alt={fileName || "Preview"}
                className="h-12 w-12 rounded-lg object-cover hover:opacity-80 transition-opacity"
              />
            </a>
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors"
            >
              <FileText className="h-5 w-5 text-emerald-600" />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-auth-foreground truncate">
              {fileName || "File terupload"}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              Lihat file <ExternalLink size={10} />
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-4 py-6 transition-colors cursor-pointer",
            dragOver
              ? "border-auth-primary bg-auth-primary-light/30"
              : error
                ? "border-red-300 bg-red-50/50"
                : "border-auth-border bg-auth-bg hover:border-auth-primary/40 hover:bg-auth-primary-light/10"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-auth-primary animate-spin" />
          ) : (
            <Upload className={cn("h-6 w-6", dragOver ? "text-auth-primary" : "text-auth-muted-foreground")} />
          )}
          <p className="text-[13px] text-auth-muted-foreground text-center">
            {uploading ? "Mengupload..." : "Klik atau seret file ke sini"}
          </p>
          <p className="text-[11px] text-auth-muted-foreground/60">
            {isImage ? "JPG, PNG, WebP (maks. 2MB)" : "PDF (maks. 2MB)"}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleChange}
        className="hidden"
      />

      {description && !error && (
        <p className="text-[12px] text-auth-muted-foreground">{description}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}
