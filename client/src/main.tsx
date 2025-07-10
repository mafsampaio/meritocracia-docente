import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AppProvider } from "./app-context";
import { ThemeProvider } from "./components/theme-provider";

// Sempre usar dark como tema padrão
const initialTheme = 'dark';

// Aplicar classe theme ao document.documentElement
document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(initialTheme);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme={initialTheme as 'light' | 'dark' | 'system'}>
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
