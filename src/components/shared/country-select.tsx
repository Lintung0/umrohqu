"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { COUNTRIES } from "@/lib/constants"
import { ChevronDown, Search, Check } from "lucide-react"

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function CountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES
    const q = search.toLowerCase()
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const selected = COUNTRIES.find((c) => c.name === value)

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

  const handleSelect = (name: string) => {
    onChange(name === value ? "" : name)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-placeholder:text-muted-foreground"
      >
        {selected ? (
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-base leading-none">{selected.emoji}</span>
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Semua Negara</span>
        )}
        <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
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
          <ul className="max-h-56 overflow-auto py-1">
            <li
              onClick={() => handleSelect("")}
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <span className={!value ? "font-medium text-foreground" : "text-muted-foreground"}>
                Semua Negara
              </span>
              {!value && <Check size={14} className="text-primary" />}
            </li>
            {filtered.map((c) => (
              <li
                key={c.code}
                onClick={() => handleSelect(c.name)}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className={value === c.name ? "font-medium" : ""}>{c.name}</span>
                </span>
                {value === c.name && <Check size={14} className="text-primary" />}
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
