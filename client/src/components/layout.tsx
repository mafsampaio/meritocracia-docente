import React, { ReactNode, useState } from 'react';
import Sidebar from './sidebar';
import { ThemeToggle } from './theme-toggle';

// Importando as logos para os temas claro e escuro
import logoWhite from '../assets/logo-all-white.png'; // Logo toda branca
import logoBlack from '../assets/logo-all-white.png'; // Usando a mesma logo toda branca
import { useTheme } from './theme-provider';

interface LayoutProps {
  children: ReactNode;
  hideSectionHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideSectionHeader = false }) => {
  // Usar estado local para o sidebar em vez de depender do AppContext
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top Bar */}
        {!hideSectionHeader && (
          <header className="bg-card shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <button 
                  className="mr-2 text-foreground" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
                {/* Logo da empresa que muda conforme o tema - aumentada */}
                <div className="h-16 mr-5">
                  <img 
                    src={theme === 'dark' ? logoWhite : logoBlack} 
                    alt="CF98 Logo" 
                    className="h-full" 
                  />
                </div>
                {/* Título será definido dentro dos componentes de página */}
              </div>
              
              {/* Botão de trocar tema */}
              <div className="flex items-center space-x-2">
                <ThemeToggle />
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={hideSectionHeader ? "p-0" : "p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
