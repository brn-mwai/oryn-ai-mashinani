"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([{ label: "Dashboard" }]);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}

// Hook for pages to set their breadcrumb
export function useSetBreadcrumb(items: BreadcrumbItem[]) {
  const { setItems } = useBreadcrumb();

  React.useEffect(() => {
    setItems(items);
  }, [JSON.stringify(items), setItems]);
}
