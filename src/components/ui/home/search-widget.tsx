"use client";

import React, { useRef, useEffect } from "react";
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
import { MapPin, Search, Calendar } from "lucide-react";

const COUNTRIES = [
  { value: "id", label: "\ud83c\uddee\ud83c\uddf9 Indonesia" },
  { value: "my", label: "\ud83c\uddf2\ud83c\uddfe Malaysia" },
  { value: "sg", label: "\ud83c\uddf8\ud83c\uddec Singapura" },
  { value: "ae", label: "\ud83c\udde6\ud83c\uddea UAE" },
]

export default function SearchWidget() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Fix the _state unused parameter
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const country = form.get("country") as string;
    const date = form.get("date") as string;

    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (date) params.set("date", date);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-xl">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4">
          {/* Country */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <MapPin className="w-3 h-3" />
              Negara Keberangkatan
            </Label>
            <Select name="country">
              <SelectTrigger className="h-11 text-sm bg-white/10 border-white/10 text-white focus:border-gold/40 focus:ring-gold/10 rounded-xl">
                <SelectValue placeholder="Pilih negara..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Negara</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <Calendar className="w-3 h-3" />
              Tanggal Keberangkatan
            </Label>
            <Input
              type="date"
              name="date"
              className="h-11 text-sm bg-white/10 border-white/10 text-white focus:border-gold/40 focus:ring-gold/10 rounded-xl [color-scheme:dark]"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col justify-end gap-0">
            <Label className="text-xs invisible">\u00a0</Label>
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl bg-gradient-to-r from-gold to-gold-light text-emerald-deep shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4 mr-1.5" />
              Cari Paket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
