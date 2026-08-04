"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface CommaInputProps {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder: string
  icon: LucideIcon
}

export default function CommaInput({ label, value, onChange, placeholder, icon: Icon }: CommaInputProps) {
  const [input, setInput] = useState("")

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault()
      const val = input.trim().replace(/,$/, "")
      if (val && !value.includes(val)) {
        onChange([...value, val])
      }
      setInput("")
    }
  }

  function removeItem(item: string) {
    onChange(value.filter((v) => v !== item))
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
        <Icon className="w-4 h-4 text-emerald-600" />
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="hover:text-emerald-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
      />
      <p className="text-xs text-muted-foreground mt-1">Tekan Enter atau koma untuk menambah</p>
    </div>
  )
}
