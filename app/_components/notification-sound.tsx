"use client";

import { useEffect, useRef } from "react";

interface NotificationSoundProps {
  companyId: string;
}

export function NotificationSound({ companyId }: NotificationSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio object once
    audioRef.current = new Audio("/alert.mp3");
    
    const eventSource = new EventSource(`/api/kds/events?companyId=${companyId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_ORDER") {
          console.log("🔔 [Notification] New order received! Playing sound...");
          audioRef.current?.play().catch((err) => {
            console.warn("❌ [Audio Alert] Som bloqueado pelo navegador. Interaja com a página primeiro para permitir alertas sonoros.", err);
          });
        }
      } catch (e) {
        console.error("Failed to parse SSE message for notification sound");
      }
    };

    eventSource.onerror = (err) => {
      console.error("Notification Sound SSE Error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [companyId]);

  return null; // This component doesn't render anything
}
