"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationCenter = ({ companyId }: { companyId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // SSE listener
  useEffect(() => {
    if (!companyId) return;

    const eventSource = new EventSource(
      `/api/kds/events?companyId=${companyId}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_ORDER") {
          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: "order",
              message: `Novo pedido recebido!`,
              timestamp: new Date(),
              read: false,
            },
            ...prev.slice(0, 19),
          ]);
        } else if (data.type === "STATUS_UPDATED") {
          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: "status",
              message: `Pedido atualizado → ${data.status || "Novo status"}`,
              timestamp: new Date(),
              read: false,
            },
            ...prev.slice(0, 19),
          ]);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [companyId]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-black text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-2xl border-none p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h4 className="text-sm font-bold text-slate-900">Notificações</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="mb-2 h-8 w-8 text-slate-200" />
              <p className="text-xs font-medium text-slate-400">
                Nenhuma notificação
              </p>
              <p className="mt-1 text-[10px] text-slate-300">
                Eventos da cozinha aparecerão aqui
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors ${
                  !notif.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    !notif.read ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700">
                    {notif.message}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatDistanceToNow(notif.timestamp, {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
