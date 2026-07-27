"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown, Globe } from "lucide-react";

const languages = [
  { id: "id", label: "Indonesia" },
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
];

export const LanguageSwitcher = () => {
  const [selected, setSelected] = useState("en");

  const activeLabel =
    languages.find((l) => l.id === selected)?.label ?? "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 items-center hover:bg-transparent"
          >
            <Globe className="size-3.5 opacity-60" />
            {activeLabel}
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            id={lang.id}
            onClick={() => setSelected(lang.id)}
            className="gap-2"
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
