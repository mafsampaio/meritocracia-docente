import React, { useState, useEffect } from 'react';
import AnalysisTab from '../components/analysis-tab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Modalidade, Professor } from '@shared/schema';

// Definição de tipos diretamente aqui para evitar dependências
interface MonthYear {
  month: number;
  year: number;
  label: string;
}

// Filtros para análise financeira
interface Filtros {
  termo?: string;
}

// Helper para criar um label no formato Mês/Ano em português
const createMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month-1]}/${year}`;
};

// Helper para gerar opções de mês/ano para selects
const generateMonthYearOptions = (monthsBack: number = 12): MonthYear[] => {
  const options: MonthYear[] = [];
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // Mês em JavaScript é 0-indexed, mas usamos 1-indexed no sistema
  const currentYear = today.getFullYear();

  for (let i = 0; i < monthsBack; i++) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month < 1) {
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

export default function AnalisePage() {
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState<MonthYear>({
    month: today.getMonth() + 1, // Mês em JavaScript é 0-indexed, mas usamos 1-indexed no sistema
    year: today.getFullYear(),
    label: createMonthYearLabel(today.getMonth() + 1, today.getFullYear())
  });
  
  // Estado para os filtros
  const [filtros, setFiltros] = useState<Filtros>({
    termo: ""
  });
  
  // Modalidades e professores não são mais necessários para os filtros,
  // já que agora usamos apenas busca por termo
  
  const monthOptions = generateMonthYearOptions(12);
  
  const handlePrevMonth = () => {
    const currentIndex = monthOptions.findIndex((m: MonthYear) => 
      m.month === currentMonthYear.month && m.year === currentMonthYear.year
    );
    if (currentIndex < monthOptions.length - 1) {
      setCurrentMonthYear(monthOptions[currentIndex + 1]);
    }
  };
  
  const handleNextMonth = () => {
    const currentIndex = monthOptions.findIndex((m: MonthYear) => 
      m.month === currentMonthYear.month && m.year === currentMonthYear.year
    );
    if (currentIndex > 0) {
      setCurrentMonthYear(monthOptions[currentIndex - 1]);
    }
  };
  
  // Limpar o filtro de busca
  const limparFiltros = () => {
    setFiltros({
      termo: ""
    });
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Análise Financeira</h1>
        <p className="text-gray-500">
          Acompanhe o desempenho financeiro das aulas por dia da semana e horário
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={`${currentMonthYear.month}/${currentMonthYear.year}`}
            onValueChange={(value) => {
              const [month, year] = value.split('/').map(Number);
              const selectedOption = monthOptions.find((m: MonthYear) => m.month === month && m.year === year);
              if (selectedOption) {
                setCurrentMonthYear(selectedOption);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option: MonthYear) => (
                <SelectItem key={`${option.month}/${option.year}`} value={`${option.month}/${option.year}`}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="w-full md:w-auto">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-md">
            <div className="bg-orange-500 rounded px-3 py-1.5 font-medium text-sm text-white">
              Análise Financeira
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros de pesquisa */}
      <div className="mb-6 border border-gray-200 dark:border-gray-800 rounded-md p-4">
        <h3 className="font-medium mb-3 text-orange-600">Filtros de pesquisa</h3>
        <div className="w-full max-w-md">
          {/* Filtro por termo de pesquisa */}
          <div>
            <Label htmlFor="termo" className="mb-1 block">Busca por modalidade</Label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  id="termo"
                  placeholder="Buscar modalidade..."
                  value={filtros.termo || ""}
                  onChange={(e) => setFiltros({ ...filtros, termo: e.target.value })}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={limparFiltros}
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <AnalysisTab 
          mesAno={`${currentMonthYear.month}/${currentMonthYear.year}`}
          termo={filtros.termo}
        />
      </div>
    </div>
  );
}