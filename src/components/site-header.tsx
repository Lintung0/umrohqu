import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { Bell } from "lucide-react";
import { DateRange } from "./ui/date-range";
import { Button } from "./ui/button";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};
export function SiteHeader() {
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
        <NavUser user={data.user} />
      </div>
    </header>
  );
}
