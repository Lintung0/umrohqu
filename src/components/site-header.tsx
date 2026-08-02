"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { Bell } from "lucide-react";
import { DateRange } from "./ui/date-range";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const [user, setUser] = useState<{ name: string; email: string; avatar: string }>({ name: "User", email: "", avatar: "" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url || "",
        });
      }
    });
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <DateRange />
      </div>
      <div className="flex gap-x-4 items-center">
        <Button variant="ghost" size="sm" className="relative -mr-3  h-9">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600" />
        </Button>
        <NavUser user={user} />
      </div>
    </header>
  );
}
