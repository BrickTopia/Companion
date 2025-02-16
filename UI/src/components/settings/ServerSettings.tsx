
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import type { SettingsFormValues } from "./types";
import { Button } from "@/components/ui/button";

export const ServerSettings = () => {
  const form = useFormContext<SettingsFormValues>();

  return (
    <div className="space-y-6 border rounded-lg p-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Server Settings</h3>
        <p className="text-sm text-gray-500">
          Configure your server endpoints
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="serverSettings.baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Server URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://api.example.com"
                />
              </FormControl>
              <FormDescription>
                The base URL for all API endpoints
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serverSettings.endpoints.favorites"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorites Endpoint</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="/api/favorites"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serverSettings.endpoints.userSettings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Settings Endpoint</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="/api/user/settings"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
