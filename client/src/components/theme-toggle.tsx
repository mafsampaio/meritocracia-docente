import * as React from "react";
import { useEffect } from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Função para alternar o tema
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    
    // Aplicar novo tema diretamente ao elemento raiz
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Salvar no localStorage e atualizar estado
    localStorage.setItem('cf98-ui-theme', newTheme);
    setTheme(newTheme);
  };

  // Sincronizar o documento com o tema atual
  useEffect(() => {
    // Forçar o dark theme em todos os loads
    const forceDarkTheme = () => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      
      // Se o estado não estiver sincronizado, atualize
      if (theme !== 'dark') {
        setTheme('dark');
      }
    };

    // Aplicar dark theme em cada montagem
    forceDarkTheme();

    // Garantir que o tema permaneça escuro nas navegações
    window.addEventListener('popstate', forceDarkTheme);
    
    return () => {
      window.removeEventListener('popstate', forceDarkTheme);
    };
  }, []);

  // Usando SVG diretamente para não depender da biblioteca Lucide
  return (
    <button
      className="rounded-full p-2 text-foreground hover:bg-accent hover:text-accent-foreground"
      onClick={toggleTheme}
      title={theme === "dark" ? "Alternar para modo claro" : "Alternar para modo escuro"}
    >
      {theme === "dark" ? (
        // Ícone do Sol para tema escuro (para voltar ao light)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-yellow-300"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // Ícone da Lua para tema claro (para voltar ao dark)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
      <span className="sr-only">Alternar tema</span>
    </button>
  );
}