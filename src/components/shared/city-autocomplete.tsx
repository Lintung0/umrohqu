"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin } from "lucide-react"

interface Suggestion {
  name: string
  country: string
  country_code: string
  formatted: string
  lat: number
  lon: number
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  countryFilter?: string
  iconClassName?: string
}

export default function CityAutocomplete({ value, onChange, placeholder = "Cari kota...", className = "", countryFilter, iconClassName }: Props) {
  const [input, setInput] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      if (!apiKey) {
        setSuggestions([])
        setOpen(false)
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        text: query,
        type: "city",
        lang: "id",
        limit: "7",
        apiKey,
      })
      if (countryFilter) {
        params.set("filter", `countrycode:${countryFilter.toLowerCase()}`)
      }

      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`)
      if (!res.ok) {
        setSuggestions([])
        setOpen(false)
        setLoading(false)
        return
      }
      const data = await res.json()

      const results: Suggestion[] = (data.features || []).map((f: any) => ({
        name: f.properties.city || f.properties.name || "",
        country: f.properties.country || "",
        country_code: f.properties.country_code || "",
        formatted: f.properties.formatted || f.properties.city || f.properties.name || "",
        lat: f.properties.lat || 0,
        lon: f.properties.lon || 0,
      })).filter((s: Suggestion) => s.name)

      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [countryFilter])

  const handleInputChange = (val: string) => {
    setInput(val)
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const selectSuggestion = (s: Suggestion) => {
    setInput(s.name)
    onChange(s.name)
    setOpen(false)
    setSuggestions([])
  }

  const inputClasses = className
    ? className
    : "h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"

  const hasCustomStyle = !!className

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconClassName || (hasCustomStyle ? "text-white/40" : "text-muted-foreground")}`}>
          <MapPin size={15} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder={placeholder}
          className={inputClasses}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${hasCustomStyle ? "border-white/40 border-t-transparent" : "border-primary border-t-transparent"}`} />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-lg border shadow-lg ${hasCustomStyle ? "border-white/20 bg-zinc-900" : "border-border bg-background"}`}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => selectSuggestion(s)}
              className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${hasCustomStyle ? "hover:bg-white/10 text-white" : "hover:bg-accent"}`}
            >
              <MapPin size={14} className={`shrink-0 ${hasCustomStyle ? "text-white/40" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <span className="font-medium">{s.name}</span>
                {s.country && <span className={`ml-1.5 text-xs ${hasCustomStyle ? "text-white/50" : "text-muted-foreground"}`}>· {s.country}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
