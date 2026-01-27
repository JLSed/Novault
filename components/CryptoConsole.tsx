"use client";

import { useEffect, useRef } from "react";

export type LogType = "info" | "success" | "error" | "warn" | "key" | "debug";

export interface ConsoleLog {
  timestamp: Date;
  type: LogType;
  label: string;
  value?: string;
}

export interface LogTypeConfig {
  color: string;
  prefix: string;
}

interface ConsoleProps {
  logs: ConsoleLog[];
  title?: string;
  height?: string;
  typeConfig?: Partial<Record<LogType, LogTypeConfig>>;
}

const defaultTypeConfig: Record<LogType, LogTypeConfig> = {
  info: { color: "text-blue-400", prefix: "[INFO]" },
  success: { color: "text-green-400", prefix: "[OK]" },
  error: { color: "text-red-400", prefix: "[ERR]" },
  warn: { color: "text-orange-400", prefix: "[WARN]" },
  key: { color: "text-yellow-400", prefix: "[KEY]" },
  debug: { color: "text-purple-400", prefix: "[DBG]" },
};

// Helper function to create log entries
export const createLog = (
  type: LogType,
  label: string,
  value?: string,
): ConsoleLog => ({
  timestamp: new Date(),
  type,
  label,
  value,
});

export default function Console({
  logs,
  title = "Console",
  height = "h-64",
  typeConfig,
}: ConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Merge custom config with defaults
  const config = { ...defaultTypeConfig, ...typeConfig };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTypeColor = (type: LogType) =>
    config[type]?.color ?? "text-gray-400";
  const getTypePrefix = (type: LogType) => config[type]?.prefix ?? "[LOG]";

  return (
    <div className="w-full text-black overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-[#333]">
        <span className="text-[#888] text-sm ml-2 font-mono">{title}</span>
      </div>

      {/* Console Body */}
      <div className={`p-4 ${height} overflow-y-auto font-mono text-sm`}>
        {logs.length === 0 ? (
          <div className="italic">No logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2">
              <div className="flex gap-2">
                <span className="">{formatTime(log.timestamp)}</span>
                <span className={getTypeColor(log.type)}>
                  {getTypePrefix(log.type)}
                </span>
                <span className="">{log.label}</span>
              </div>
              {log.value && (
                <div className="ml-16 text-primary break-all text-xs mt-1 bg-primary/10 px-2 py-1 rounded">
                  {log.value}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}
