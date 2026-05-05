"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type AppMode = "gestao" | "operacao";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isLiveMode: boolean;
  setIsLiveMode: (isLiveMode: boolean) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const STORAGE_KEY = "kipo-app-mode";
const LIVE_MODE_KEY = "kipo-live-mode";

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>("gestao");
  const [isLiveMode, setIsLiveModeState] = useState<boolean>(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY) as AppMode | null;
    if (savedMode === "gestao" || savedMode === "operacao") {
      setModeState(savedMode);
    }

    const savedLive = localStorage.getItem(LIVE_MODE_KEY);
    if (savedLive === "true") {
      setIsLiveModeState(true);
    }
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    setMode(mode === "gestao" ? "operacao" : "gestao");
  };

  const setIsLiveMode = (isLive: boolean) => {
    setIsLiveModeState(isLive);
    localStorage.setItem(LIVE_MODE_KEY, String(isLive));
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode, isLiveMode, setIsLiveMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  
  // Return a safe default if used outside the provider (e.g. in public pages or during initial load)
  if (!context) {
    return {
      mode: "gestao" as AppMode,
      setMode: () => {},
      toggleMode: () => {},
      isLiveMode: false,
      setIsLiveMode: () => {},
    };
  }
  
  return context;
};
