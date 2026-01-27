"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ConsoleLog, createLog, LogType } from "./CryptoConsole";

interface ConsoleContextType {
  logs: ConsoleLog[];
  addLog: (type: LogType, label: string, value?: string) => void;
  clearLogs: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | null>(null);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  const addLog = useCallback((type: LogType, label: string, value?: string) => {
    setLogs((prev) => [...prev, createLog(type, label, value)]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <ConsoleContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error("useConsole must be used within a ConsoleProvider");
  }
  return context;
}
