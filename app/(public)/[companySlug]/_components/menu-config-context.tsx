"use client";

import { createContext, useContext } from "react";

interface MenuConfig {
  requireSelfieOnCheckout: boolean;
  enableServiceTax: boolean;
}

const MenuConfigContext = createContext<MenuConfig>({
  requireSelfieOnCheckout: false,
  enableServiceTax: true,
});

export function MenuConfigProvider({
  children,
  requireSelfieOnCheckout,
  enableServiceTax,
}: {
  children: React.ReactNode;
  requireSelfieOnCheckout: boolean;
  enableServiceTax: boolean;
}) {
  return (
    <MenuConfigContext.Provider value={{ requireSelfieOnCheckout, enableServiceTax }}>
      {children}
    </MenuConfigContext.Provider>
  );
}

export function useMenuConfig(): MenuConfig {
  return useContext(MenuConfigContext);
}
