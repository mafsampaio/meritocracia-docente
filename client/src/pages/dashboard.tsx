import React, { useState, useEffect } from 'react';
import { generateMonthYearOptions } from '@/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinancialDashboard from '@/components/financial-dashboard';
import AnalysisTab from '@/components/analysis-tab';
import TeacherTable from '@/components/teacher-table';
import { useAuth } from '@/lib/auth';

const Dashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const monthYearOptions = generateMonthYearOptions();
  
  // Estado local para substituir o useAppContext
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
    label: `${monthYearOptions[0].label}`
  });
  
  // Efeito para atualizar o label quando mês/ano mudar
  useEffect(() => {
    const option = monthYearOptions.find(
      opt => opt.month === currentMonthYear.month && opt.year === currentMonthYear.year
    );
    if (option && option.label !== currentMonthYear.label) {
      setCurrentMonthYear(prev => ({ ...prev, label: option.label }));
    }
  }, [currentMonthYear.month, currentMonthYear.year, monthYearOptions]);

  return (
    <>
      <header className="bg-white dark:bg-background shadow-sm">
        <div className="flex items-center justify-between py-5 px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Select
                value={`${currentMonthYear.month}-${currentMonthYear.year}`}
                onValueChange={(value) => {
                  const [month, year] = value.split('-').map(Number);
                  setCurrentMonthYear({ month, year, label: '' });
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
        {isAdmin && (
          <>
            <FinancialDashboard 
              mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
            />
            
            <AnalysisTab 
              mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
            />
            
            <TeacherTable 
              mesAno={`${currentMonthYear.month + 1}/${currentMonthYear.year}`} 
            />
          </>
        )}
        
        {!isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-xl font-medium mb-4">Bem-vindo ao Sistema de Meritocracia</h3>
            <p className="mb-6 text-gray-600">
              Utilize o menu lateral para navegar pelo sistema e acessar suas informações.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h4 className="font-medium mb-2">Seu Perfil</h4>
                <p className="text-sm text-gray-500">Visualize suas informações, estatísticas e histórico de pagamentos.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="font-medium mb-2">Suas Aulas</h4>
                <p className="text-sm text-gray-500">Verifique as aulas agendadas, horários e detalhes específicos.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h4 className="font-medium mb-2">Check-in</h4>
                <p className="text-sm text-gray-500">Registre a quantidade de alunos presentes nas suas aulas.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
