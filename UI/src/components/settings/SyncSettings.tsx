
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { SettingsFormValues } from "./types";

export const SyncSettings = () => {
  const form = useFormContext<SettingsFormValues>();
  const syncEnabled = form.watch("syncEnabled");
  const cachePolicy = form.watch("cachePolicy");
  const syncFrequency = form.watch("syncFrequency");

  return (
    <div className="space-y-6 border rounded-lg p-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Sync Settings</h3>
      </div>
      
      <FormField
        control={form.control}
        name="syncEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel>Sync Favorites</FormLabel>
              <p className="text-sm text-gray-500">
                Keep your favorites in sync across all your devices
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {syncEnabled && (
        <>
          <FormField
            control={form.control}
            name="syncFrequency"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Sync Frequency</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hourly" id="hourly" />
                      <Label htmlFor="hourly" className="font-normal">
                        Every hour
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="font-normal">
                        Once a day
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="font-normal">
                        Once a week
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom-freq" className="font-normal">
                        Custom
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {syncFrequency === "custom" && (
            <FormField
              control={form.control}
              name="customSyncInterval"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Custom Sync Interval (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 1 minute between syncs
                  </FormDescription>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="cachePolicy"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Storage Preference</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="font-normal">
                        Normal - Save for 30 days
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="minimal" id="minimal" />
                      <Label htmlFor="minimal" className="font-normal">
                        Minimal - Save for 7 days
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aggressive" id="aggressive" />
                      <Label htmlFor="aggressive" className="font-normal">
                        Extended - Save for 90 days
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom-cache" className="font-normal">
                        Custom
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {cachePolicy === "custom" && (
            <FormField
              control={form.control}
              name="customCacheDuration"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Custom Cache Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
};
