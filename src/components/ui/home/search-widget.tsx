"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, Search, Calendar, Wallet } from "lucide-react";

function generateMonths(): string[] {
  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
}

const DEPARTURE_MONTHS = generateMonths();

const UMRAH_COSTS = [
  "Semua Biaya",
  "< Rp 25 Juta",
  "Rp 25 – 30 Juta",
  "Rp 30 – 35 Juta",
  "Rp 35 – 40 Juta",
  "Rp 40 – 50 Juta",
  "> Rp 50 Juta",
];

interface GeoResult {
  city?: string;
  formatted?: string;
}

export default function SearchWidget() {
  const router = useRouter();

  const [departure, setDeparture] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isOpenDeparture, setIsOpenDeparture] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const departureRef = useRef<HTMLDivElement>(null);

  const [time, setTime] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (departureRef.current && !departureRef.current.contains(e.target as Node)) {
        setIsOpenDeparture(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) { setSuggestions([]); setIsOpenDeparture(false); return; }
    setGeoLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "d5d7246fcd0f40449b555b02d9de6643";
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${apiKey}&limit=6&filter=countrycode:id&type=city&format=json&lang=id`
      );
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results);
        setIsOpenDeparture(true);
      }
    } catch {}
    setGeoLoading(false);
  };

  const handleDepartureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeparture(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const selectDeparture = (s: GeoResult) => {
    setDeparture(s.city || s.formatted?.split(",")[0] || "");
    setSuggestions([]);
    setIsOpenDeparture(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (departure) params.set("departure", departure);
    if (time) params.set("month", time);
    if (cost && cost !== "Semua Biaya") params.set("cost", cost);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Floating glass card */}
      <div className="glass-strong border border-white/20 rounded-2xl shadow-xl shadow-black/10 p-1.5">
        {/* Label strip */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-glow">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground/80">
            Pencarian Cepat Paket Umroh
          </span>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4"
        >
          {/* Departure location */}
          <div ref={departureRef} className="relative w-full space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <MapPin className="w-3 h-3" />
              Lokasi Keberangkatan
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={departure}
                onChange={handleDepartureChange}
                onFocus={() => suggestions.length > 0 && setIsOpenDeparture(true)}
                placeholder="Pilih atau cari kota..."
                className="h-11 pl-3 pr-9 text-sm bg-white/60 border-border/50 focus:border-primary/40 focus:ring-primary/10 rounded-xl"
              />
              {geoLoading ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              ) : (
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
            {isOpenDeparture && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-border/50 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => selectDeparture(s)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors cursor-pointer select-none"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium">{s.city || s.formatted?.split(",")[0]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Departure time */}
          <div className="w-full space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Waktu Keberangkatan
            </Label>
            <Select value={time} onValueChange={(v) => setTime(v ?? "")}>
              <SelectTrigger className="h-11 text-sm bg-white/60 border-border/50 focus:border-primary/40 focus:ring-primary/10 rounded-xl">
                <SelectValue placeholder="Pilih waktu..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTURE_MONTHS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost estimate */}
          <div className="w-full space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Wallet className="w-3 h-3" />
              Estimasi Biaya
            </Label>
            <Select value={cost} onValueChange={(v) => setCost(v ?? "")}>
              <SelectTrigger className="h-11 text-sm bg-white/60 border-border/50 focus:border-primary/40 focus:ring-primary/10 rounded-xl">
                <SelectValue placeholder="Pilih estimasi..." />
              </SelectTrigger>
              <SelectContent>
                {UMRAH_COSTS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit button */}
          <div className="w-full space-y-1.5">
            <Label className="invisible text-xs">‎</Label>
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-glow text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4 mr-2" />
              Cari Paket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
