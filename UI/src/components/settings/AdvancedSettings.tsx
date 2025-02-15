
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ServerSettings } from "./ServerSettings";
import { useState } from "react";

interface AdvancedSettingsProps {
  showAdvanced: boolean;
  onAdvancedChange: (value: boolean) => void;
  cachePolicy: string;
  customCacheDuration: string;
  customSyncInterval: string;
  onDurationChange: (value: string) => void;
  onIntervalChange: (value: string) => void;
  serverProps: {
    serverUrl: string;
    customEndpoints: {
      ingredients: string;
      favorites: string;
    };
    showServerWarning: boolean;
    onServerUrlChange: (value: string) => void;
    onEndpointChange: (endpoint: string, value: string) => void;
    onWarningDismiss: () => void;
  };
}

export const AdvancedSettings = ({
  showAdvanced,
  onAdvancedChange,
  cachePolicy,
  customCacheDuration,
  customSyncInterval,
  onDurationChange,
  onIntervalChange,
  serverProps,
}: AdvancedSettingsProps) => {
  const [isServerOpen, setIsServerOpen] = useState(false);

  return (
    <Collapsible
      open={showAdvanced}
      onOpenChange={onAdvancedChange}
      className="border rounded-lg p-4 space-y-4"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full flex justify-between items-center">
          <span className="text-sm font-medium">Advanced Settings</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4">
        {cachePolicy === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="cacheDuration">Custom Cache Duration (days)</Label>
            <Input 
              id="cacheDuration"
              type="number"
              min="1"
              value={customCacheDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
          <Input
            id="syncInterval"
            type="number"
            min="1"
            value={customSyncInterval}
            onChange={(e) => onIntervalChange(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            How often to check for updates (minimum 1 minute)
          </p>
        </div>

        <div className="pt-4 border-t">
          <Collapsible open={isServerOpen} onOpenChange={setIsServerOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex justify-between items-center">
                <span className="text-sm font-medium">Server Settings</span>
                {isServerOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <ServerSettings />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
