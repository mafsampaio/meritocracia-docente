import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface DashboardMetrics {
  totalAulas: number;
  ocupacaoMedia: number;
  receitaTotal: number;
  resultadoLiquido: number;
  crescimentoAulas: number;
  crescimentoOcupacao: number;
  crescimentoReceita: number;
  crescimentoResultado: number;
}

interface AulasLucroPrejuizoMetrics {
  aulasComLucro: number;
  aulasComPrejuizo: number;
  aulasSemCheckIn: number;
  totalAulas: number;
}

interface FinancialDashboardProps {
  mesAno: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ mesAno }) => {
  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: [`/api/dashboard/modulo-financeiro/metrics?mesAno=${mesAno}`],
  });
  
  const { data: aulasLucroPrejuizo, isLoading: isLoadingAulasLP } = useQuery<AulasLucroPrejuizoMetrics>({
    queryKey: [`/api/dashboard/aulas-lucro-prejuizo?mesAno=${mesAno}`],
  });
  
  // Se os dados da API estiverem vazios ou carregando, usamos valores corretos de referência
  const dadosAulasLP = {
    aulasComLucro: aulasLucroPrejuizo?.aulasComLucro || 0,
    aulasComPrejuizo: aulasLucroPrejuizo?.aulasComPrejuizo || 0,
    aulasSemCheckIn: aulasLucroPrejuizo?.aulasSemCheckIn || 0,
    totalAulas: aulasLucroPrejuizo?.totalAulas || data?.totalAulas || 0
  };

  if (isLoading || isLoadingAulasLP) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="card-dashboard animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-8 bg-red-50 p-4 rounded-lg text-red-800">
        <p>Erro ao carregar métricas do dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {/* Card 1 - Total de Aulas */}
        <div className="card-dashboard lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title">Total de Aulas</p>
              <h3 className="card-value text-white">{data.totalAulas}</h3>
              <p className={`text-sm mt-1 ${data.crescimentoAulas >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.crescimentoAulas >= 0 ? '+' : ''}{data.crescimentoAulas}% do mês anterior
              </p>
            </div>
            <div className="card-icon bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Card 2 - Ocupação Média */}
        <div className="card-dashboard lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title">Ocupação Média</p>
              <h3 className="card-value text-white">{data.ocupacaoMedia}%</h3>
              <p className={`text-sm mt-1 ${data.crescimentoOcupacao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.crescimentoOcupacao >= 0 ? '+' : ''}{data.crescimentoOcupacao}% do mês anterior
              </p>
            </div>
            <div className="card-icon bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Card 3 - Receita Total */}
        <div className="card-dashboard lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title">Receita Total</p>
              <h3 className="card-value text-white value-money">R$ {data.receitaTotal.toLocaleString('pt-BR')}</h3>
              <p className={`text-sm mt-1 ${data.crescimentoReceita >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.crescimentoReceita >= 0 ? '+' : ''}{data.crescimentoReceita}% do mês anterior
              </p>
            </div>
            <div className="card-icon bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Card 4 - Resultado Líquido */}
        <div className="card-dashboard lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title">Resultado Líquido</p>
              <h3 className={`card-value text-white ${data.resultadoLiquido >= 0 ? 'positive-value' : 'negative-value'}`}>
                R$ {data.resultadoLiquido.toLocaleString('pt-BR')}
              </h3>
              <p className={`text-sm mt-1 ${data.crescimentoResultado >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.crescimentoResultado >= 0 ? '+' : ''}{data.crescimentoResultado}% do mês anterior
              </p>
            </div>
            <div className="card-icon bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Layout com apenas 5 cards (sem o de aulas analisadas) */}
        
        {/* Card 5 - Aulas com Lucro */}
        <div className="card-dashboard lg:col-span-1 bg-green-900/20 border border-green-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title text-green-300">Aulas com Lucro</p>
              <h3 className="card-value text-green-300">{dadosAulasLP.aulasComLucro}</h3>
              <p className="text-sm mt-1 text-green-300">
                {Math.round((dadosAulasLP.aulasComLucro / data.totalAulas) * 100)}% do total
              </p>
            </div>
            <div className="card-icon bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Card 6 - Aulas com Prejuízo */}
        <div className="card-dashboard lg:col-span-1 bg-red-900/20 border border-red-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title text-red-300">Aulas com Prejuízo</p>
              <h3 className="card-value text-red-300">{dadosAulasLP.aulasComPrejuizo}</h3>
              <p className="text-sm mt-1 text-red-300">
                {Math.round((dadosAulasLP.aulasComPrejuizo / data.totalAulas) * 100)}% do total
              </p>
            </div>
            <div className="card-icon bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Card 7 - Aulas sem Check-in */}
        <div className="card-dashboard lg:col-span-1 bg-gray-700/20 border border-gray-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="card-title section-title text-gray-300">Aulas sem Check-in</p>
              <h3 className="card-value text-gray-300">{dadosAulasLP.aulasSemCheckIn}</h3>
              <p className="text-sm mt-1 text-gray-300">
                {Math.round((dadosAulasLP.aulasSemCheckIn / data.totalAulas) * 100)}% do total
              </p>
            </div>
            <div className="card-icon bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
