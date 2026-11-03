// ============================================================
// STATUS BAR - Optional human-readable privacy & telemetry bar
// ============================================================
import React from "react";
import { ShieldCheck, ShieldOff, Zap } from "lucide-react";
import type { SystemAuditLog } from "../../types/database.types";
import { useI18n } from "../../i18n";

export interface StatusBarProps {
  log: Pick<SystemAuditLog, "action_type" | "execution_time_ms" | "zero_retention_flag"> | null;
  id?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ log, id = "status-bar" }) => {
  const { t } = useI18n();
  if (!log) return null;
  return (
    <footer className="zf-status no-print" id={id}>
      <span>
        <Zap size={14} strokeWidth={1.5} color="var(--teal)" />
        {t("status.scanSpeed")} <b>{(log.execution_time_ms / 1000).toFixed(1)}s</b>
      </span>
      <span className="sp" />
      {log.zero_retention_flag ? (
        <span className="ok">
          <ShieldCheck size={14} strokeWidth={1.5} />
          {t("status.zeroRetention")}
        </span>
      ) : (
        <span>
          <ShieldOff size={14} strokeWidth={1.5} />
          {t("status.standardRetention")}
        </span>
      )}
    </footer>
  );
};

export default StatusBar;
