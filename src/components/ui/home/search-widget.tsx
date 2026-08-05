"use client";

import React, { useRef, useState, useEffect } from "react";
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
import { useTranslation } from "@/lib/i18n";
import { Search, Calendar, Package, MapPin } from "lucide-react";
import CityAutocomplete from "@/components/shared/city-autocomplete";
import { getAseanCountryByCode } from "@/lib/constants";

const MONTHS = [
  { value: "januari", label: "Januari" },
  { value: "februari", label: "Februari" },
  { value: "maret", label: "Maret" },
  { value: "april", label: "April" },
  { value: "mei", label: "Mei" },
  { value: "juni", label: "Juni" },
  { value: "juli", label: "Juli" },
  { value: "agustus", label: "Agustus" },
  { value: "september", label: "September" },
  { value: "oktober", label: "Oktober" },
  { value: "november", label: "November" },
  { value: "desember", label: "Desember" },
];

const YEARS = Array.from({ length: 3 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: String(year), label: String(year) };
});

export default function SearchWidget() {
  const { t } = useTranslation();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [departureCity, setDepartureCity] = useState("");
  const [country, setCountry] = useState("id");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/user/country");
        const data = await res.json();
        if (data.country) {
          setCountry(data.country);
        }
      } catch {}
    };
    fetchCountry();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = form.get("q") as string;

    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (departureCity) params.set("departure", departureCity);
    if (selectedMonth && selectedYear) {
      params.set("month", `${selectedMonth} ${selectedYear}`);
    } else if (selectedMonth) {
      params.set("month", selectedMonth);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-xl">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 sm:gap-3 p-3 sm:p-4">
          {/* Keyword Search */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <Package className="w-3 h-3" />
              Nama Paket / Travel
            </Label>
            <Input
              type="text"
              name="q"
              placeholder="Contoh: Umroh Plus Turki..."
              className="h-11 text-sm bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-gold/40 focus:ring-gold/10 rounded-xl"
            />
          </div>

          {/* Departure City */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <MapPin className="w-3 h-3" />
              Kota Keberangkatan
            </Label>
            <CityAutocomplete
              value={departureCity}
              onChange={setDepartureCity}
              placeholder="Contoh: Jakarta, Bandung..."
              countryFilter={country}
              className="h-11 w-full text-sm bg-white/10 border-white/10 text-white pl-9 pr-3 outline-none placeholder:text-white/60 focus:border-gold/40 focus:ring-gold/10 rounded-xl"
            />
          </div>

          {/* Month/Year Picker */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <Calendar className="w-3 h-3" />
              {t.hero.month}
            </Label>
            <div className="flex gap-1.5">
              <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? "")}>
                <SelectTrigger className="h-11 flex-1 text-sm bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-gold/40 focus:ring-gold/10 rounded-xl">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v ?? "")}>
                <SelectTrigger className="h-11 w-24 text-sm bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-gold/40 focus:ring-gold/10 rounded-xl">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col justify-end gap-0">
            <Label className="text-xs invisible">&nbsp;</Label>
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl bg-gradient-to-r from-gold to-gold-light text-emerald-deep shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
