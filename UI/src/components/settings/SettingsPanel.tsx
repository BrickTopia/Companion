
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SyncSettings } from "./SyncSettings";
import { ServerSettings } from "./ServerSettings";
import { settingsFormSchema, type SettingsFormValues } from "./types";

export const SettingsPanel = () => {
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      syncEnabled: false,
      cachePolicy: "normal",
      syncFrequency: "daily",
      customSyncInterval: "30",
      customCacheDuration: "30",
      serverSettings: {
        baseUrl: "",
        endpoints: {
          favorites: "/api/favorites",
          userSettings: "/api/user/settings",
        },
      },
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      localStorage.setItem("settings", JSON.stringify(data));
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
            <p className="text-sm text-gray-600">
              Manage sync and server configuration
            </p>
          </div>

          <div className="space-y-6">
            <SyncSettings />
            <ServerSettings />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!form.formState.isDirty}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
};
