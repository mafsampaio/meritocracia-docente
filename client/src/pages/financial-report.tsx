import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinancialDashboard from '@/components/financial-dashboard';
import AnalysisTab from '@/components/analysis-tab';
import TeacherTable from '@/components/teacher-table';

// Copiar as funções relevantes de app-context.tsx para não depender do contexto
const createMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month]}/${year}`;
};

const generateMonthYearOptions = (monthsBack: number = 12) => {
  const options: { month: number; year: number; label: string }[] = [];
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

const FinancialReport: React.FC = () => {
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
    label: createMonthYearLabel(today.getMonth(), today.getFullYear())
  });
  const monthYearOptions = generateMonthYearOptions();

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Relatório Financeiro</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Select
                value={`${currentMonthYear.month}-${currentMonthYear.year}`}
                onValueChange={(value) => {
                  const [month, year] = value.split('-').map(Number);
                  setCurrentMonthYear({ 
                    month, 
                    year, 
                    label: createMonthYearLabel(month, year) 
                  });
                }}
              >
                <SelectTrigger className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded-md focus:outline-none focus:ring-primary focus:border-primary w-44">
                  <SelectValue placeholder={currentMonthYear.label} />
                </SelectTrigger>
                <SelectContent>
                  {monthYearOptions.map((option) => (
                    <SelectItem key={`${option.month}-${option.year}`} value={`${option.month}-${option.year}`}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <FinancialDashboard 
          mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
        />
        
        <AnalysisTab 
          mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
        />
        
        <TeacherTable 
          mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
        />
      </div>
    </>
  );
};

export default FinancialReport;
