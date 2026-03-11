import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/db/settings";

interface TopBarProps {
  title: string;
}

export async function TopBar({ title }: TopBarProps) {
  const settings = await getSettings();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-5 w-5" />
        </Button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {settings.churchName}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
