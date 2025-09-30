"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useThemeStyle } from "@/hooks/use-theme-style";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
export const ThemeStyleProvider = React.memo(function ({
  children,
}: {
  children: React.ReactNode;
}) {
  const { themeStyle } = useThemeStyle();

  React.useLayoutEffect(() => {
    if (document.body.getAttribute("data-theme") !== themeStyle) {
      document.body.setAttribute("data-theme", themeStyle);
    }
  }, [themeStyle]);

  // Always render children to prevent hydration mismatch
  // The theme will be applied via useLayoutEffect
  return <>{children}</>;
});

ThemeStyleProvider.displayName = "ThemeStyleProvider";
