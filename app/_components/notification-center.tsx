"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell, Cake, Clock, Check, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCRMAlertsAction } from "@/app/_actions/crm/get-alerts";
import Link from "next/link";

interface Notification {
  id: string;
  type: "order" | "status" | "crm" | "birthday";
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

export const NotificationCenter = ({ companyId }: { companyId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const isFirstRender = useRef(true);

  const triggerAlert = (message: string) => {
    setIsShaking(true);
    toast.info(message, {
      icon: "🔔",
      duration: 5000,
    });
    setTimeout(() => setIsShaking(false), 2000);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Poll for CRM alerts
  useEffect(() => {
    const fetchCRMAlerts = async () => {
      const result = await getCRMAlertsAction();
      if (result?.data) {
        const crmNotifications: Notification[] = result.data.map((alert) => ({
          id: `crm-${alert.id}`,
          type: alert.type === "BIRTHDAY" ? "birthday" : "crm",
          message: alert.type === "BIRTHDAY" ? `Bolo: ${alert.customerName}` : `${alert.customerName}: ${alert.title}`,
          timestamp: new Date(alert.dueDate),
          read: false,
          href: `/customers?action=open-modal&customerId=${alert.customerId}`,
        }));

        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = crmNotifications.filter((n) => !existingIds.has(n.id));
          
          if (newOnes.length > 0 && !isFirstRender.current) {
            triggerAlert(`${newOnes.length} novos alertas do CRM!`);
          }
          
          isFirstRender.current = false;
          return [...newOnes, ...prev].slice(0, 50);
        });
      }
    };

    fetchCRMAlerts();
    const interval = setInterval(fetchCRMAlerts, 60000); // 60s polling

    return () => clearInterval(interval);
  }, []);

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
          triggerAlert("Novo pedido recebido!");
          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: "order",
              message: `Novo pedido recebido!`,
              timestamp: new Date(),
              read: false,
            },
            ...prev.slice(0, 49),
          ]);
        } else if (data.type === "STATUS_UPDATED") {
          triggerAlert(`Pedido atualizado → ${data.status || "Novo status"}`);
          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: "status",
              message: `Pedido atualizado → ${data.status || "Novo status"}`,
              timestamp: new Date(),
              read: false,
            },
            ...prev.slice(0, 49),
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
          className="relative h-9 w-9 rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-muted-foreground"
        >
          <Bell className={`h-4 w-4 ${isShaking ? "animate-shake text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-black text-background shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-2xl border-none p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-bold text-foreground">Notificações</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Nenhuma notificação
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Alertas do CRM e Cozinha aparecerão aqui
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const content = (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors ${
                    !notif.read ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      !notif.read ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${notif.type === "crm" || notif.type === "birthday" ? "text-primary" : "text-foreground"}`}>
                      {notif.type === "crm" && "⏰ "}
                      {notif.type === "birthday" && "🎂 "}
                      {notif.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(notif.timestamp, {
                        locale: ptBR,
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );

              if (notif.href) {
                return (
                  <Link key={notif.id} href={notif.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                );
              }

              return content;
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
