import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MonthYear {
  month: number;
  year: number;
  label: string;
}

interface AppContextType {
  currentMonthYear: MonthYear;
  setCurrentMonthYear: (monthYear: MonthYear) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para criar um label no formato Mês/Ano em português
const createMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month]}/${year}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState<MonthYear>({
    month: today.getMonth(),
    year: today.getFullYear(),
    label: createMonthYearLabel(today.getMonth(), today.getFullYear())
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateMonthYear = (monthYear: MonthYear) => {
    // Certifique-se de que o label esteja sempre atualizado
    const updatedMonthYear = {
      ...monthYear,
      label: createMonthYearLabel(monthYear.month, monthYear.year)
    };
    setCurrentMonthYear(updatedMonthYear);
  };

  return (
    <AppContext.Provider 
      value={{ 
        currentMonthYear, 
        setCurrentMonthYear: updateMonthYear,
        sidebarOpen,
        setSidebarOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};

// Helper para gerar opções de mês/ano para selects
export const generateMonthYearOptions = (monthsBack: number = 12): MonthYear[] => {
  const options: MonthYear[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (let i = 0; i < monthsBack; i++) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month < 0) {
      month += 12;
      year -= 1;
    }

    options.push({
      month,
      year,
      label: createMonthYearLabel(month, year)
    });
  }

  return options;
};
