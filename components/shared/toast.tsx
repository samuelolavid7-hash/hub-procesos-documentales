"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/shared/icons";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "info";
}

interface ToastContextValue {
  showToast: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setMessages((current) => [...current, { ...message, id }]);

    window.setTimeout(() => {
      setMessages((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 right-5 z-[60] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${message.tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
              <Icon name={message.tone === "success" ? "check" : "info"} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{message.title}</p>
              {message.description ? <p className="mt-0.5 text-sm text-slate-500">{message.description}</p> : null}
            </div>
            <button
              aria-label="Cerrar notificación"
              className="text-slate-400 hover:text-slate-700"
              onClick={() => setMessages((current) => current.filter((item) => item.id !== message.id))}
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe utilizarse dentro de ToastProvider");
  return context;
}
