"use client";

import { useAppMode } from "@/app/_providers/app-mode-provider";
import { cn } from "@/app/_lib/utils";

interface LayoutContentWrapperProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  banner: React.ReactNode;
  children: React.ReactNode;
  pathname: string;
}

export const LayoutContentWrapper = ({ 
  sidebar, 
  header, 
  banner, 
  children,
  pathname 
}: LayoutContentWrapperProps) => {
  const { isLiveMode } = useAppMode();
  const effectiveLiveMode = isLiveMode && pathname.startsWith("/kds");

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {!effectiveLiveMode && sidebar}
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {!effectiveLiveMode && header}
        {!effectiveLiveMode && banner}

        <main className={cn(
          "flex-1 bg-muted",
          (pathname.startsWith("/kds") || effectiveLiveMode) ? "overflow-hidden" : "overflow-y-auto"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};
