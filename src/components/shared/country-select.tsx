"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ASEAN_COUNTRIES } from "@/lib/constants"
import { ChevronDown, Search, Check, Globe } from "lucide-react"

interface Props {
  value: string
  onChange: (code: string) => void
  className?: string
}

export default function CountrySelect({ value, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search) return ASEAN_COUNTRIES
    const q = search.toLowerCase()
    return ASEAN_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const selected = ASEAN_COUNTRIES.find((c) => c.code === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (code: string) => {
    onChange(code === value ? "id" : code)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center justify-between gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-1 text-sm text-white shadow-xs outline-none transition-all hover:bg-white/[0.12] focus-visible:border-gold/40 focus-visible:ring-2 focus-visible:ring-gold/20"
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span className="text-base leading-none">{selected.emoji}</span>
            <span className="hidden sm:inline text-xs font-medium">{selected.name}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white/60">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Negara</span>
          </span>
        )}
        <ChevronDown size={12} className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-background shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari negara..."
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filtered.map((c) => (
              <li
                key={c.code}
                onClick={() => handleSelect(c.code)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <span className="text-base leading-none">{c.emoji}</span>
                <span className={value === c.code ? "font-medium" : ""}>{c.name}</span>
                {value === c.code && <Check size={14} className="ml-auto text-primary" />}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Negara tidak ditemukan
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
