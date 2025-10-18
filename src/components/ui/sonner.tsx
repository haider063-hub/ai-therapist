"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const themeBase = useMemo(() => {
    return theme == "dark" ? "dark" : "default";
  }, [theme]);
  return (
    <Sonner
      theme={themeBase as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          color: "#000",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        },
        classNames: {
          toast:
            "bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg",
          title: "text-gray-900 font-semibold",
          description: "text-gray-700",
          actionButton: "bg-blue-600 hover:bg-blue-700 text-white",
          cancelButton: "bg-gray-200 hover:bg-gray-300 text-gray-800",
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
          info: "bg-blue-50 border-blue-200 text-blue-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
