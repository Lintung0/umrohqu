"use client"

import { useState } from "react"
import { Mail, AlertCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface AuthInputFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  autoComplete?: string
  icon?: LucideIcon
  type?: string
}

export default function AuthInputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  icon: Icon = Mail,
  type = "text",
}: AuthInputFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
        {label}
      </label>
      <div
        className="flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] transition-[border-color,box-shadow] duration-150"
        style={{
          borderColor: error ? "#DC2626" : focused ? "#2A7D4F" : "#DDE8E2",
          background: error ? "#FEF2F2" : "#FAFFFE",
          boxShadow:
            focused && !error
              ? "0 0 0 3px rgba(42,125,79,0.13)"
              : error && focused
              ? "0 0 0 3px rgba(220,38,38,0.09)"
              : "none",
        }}
      >
        <div className="flex items-center pl-3.5" style={{ color: focused ? "#2A7D4F" : "#5C7268" }}>
          <Icon size={18} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 border-none bg-transparent px-3 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}
