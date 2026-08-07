import { Lock } from "lucide-react";

import { SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { READ_ONLY_NOTICE } from "@/lib/settings/meta";
import { notificationSettingsMock } from "@/lib/settings/mocks";

const CHANNELS = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "slack", label: "Slack" },
] as const;

export function NotificationsSection() {
  return (
    <SettingsCard
      title="Notifications"
      action={
        <Badge variant="neutral">
          <Lock aria-hidden="true" />
          {READ_ONLY_NOTICE}
        </Badge>
      }
    >
      <ul className="mt-2 flex flex-col gap-3">
        {notificationSettingsMock.map((n) => (
          <li
            key={n.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 @3xl:flex-row @3xl:items-center @3xl:justify-between"
          >
            <div className="min-w-0">
              <p className="text-[14px] text-foreground">{n.label}</p>
              <p className="text-[12px] leading-4 text-muted-foreground">{n.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 @3xl:shrink-0">
              {CHANNELS.map((channel) => (
                <div key={channel.key} className="flex items-center gap-2">
                  <Switch
                    checked={n[channel.key]}
                    disabled
                    aria-label={`${channel.label} — ${n.label}`}
                  />
                  <span className="text-[12px] text-muted-foreground">{channel.label}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
