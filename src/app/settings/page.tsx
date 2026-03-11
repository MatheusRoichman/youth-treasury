import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/lib/db/settings";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
            <p className="text-sm text-gray-500">Gerencie as informações do sistema</p>
          </div>
        </div>

        <SettingsForm
          defaultValues={{
            churchName: settings.churchName,
            departmentName: settings.departmentName,
            treasurerName: settings.treasurerName,
            memberContributionAmount: Number(settings.memberContributionAmount),
          }}
        />
      </main>
    </div>
  );
}
