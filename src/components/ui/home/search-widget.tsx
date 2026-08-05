"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { Search, Calendar, Package, MapPin } from "lucide-react";
import CityAutocomplete from "@/components/shared/city-autocomplete";
import { getAseanCountryByCode } from "@/lib/constants";

export default function SearchWidget() {
  const { t } = useTranslation();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [departureCity, setDepartureCity] = useState("");
  const [country, setCountry] = useState("id");

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
    const date = form.get("date") as string;

    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (departureCity) params.set("departure", departureCity);
    if (date) params.set("month", date);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-xl">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 sm:gap-3 p-3 sm:p-4">
          {/* Keyword Search */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <Package className="w-3 h-3" />
              Nama Paket / Travel
            </Label>
            <Input
              type="text"
              name="q"
              placeholder="Contoh: Umroh Plus Turki..."
              className="h-11 text-sm bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-gold/40 focus:ring-gold/10 rounded-xl"
            />
          </div>

          {/* Departure City */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <MapPin className="w-3 h-3" />
              Kota Keberangkatan
            </Label>
            <CityAutocomplete
              value={departureCity}
              onChange={setDepartureCity}
              placeholder="Contoh: Jakarta, Bandung..."
              countryFilter={country}
              className="h-11 text-sm bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-gold/40 focus:ring-gold/10 rounded-xl"
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <Calendar className="w-3 h-3" />
              {t.hero.month}
            </Label>
            <Input
              type="date"
              name="date"
              className="h-11 text-sm bg-white/10 border-white/10 text-white focus:border-gold/40 focus:ring-gold/10 rounded-xl [color-scheme:dark]"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col justify-end gap-0">
            <Label className="text-xs invisible">&nbsp;</Label>
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl bg-gradient-to-r from-gold to-gold-light text-emerald-deep shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4 mr-1.5" />
              {t.hero.search}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
