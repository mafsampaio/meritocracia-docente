import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import ClassDetailModal from './class-detail-modal';

interface ModalidadeColors {
  [key: string]: {
    bg: string;
    border: string;
    hover: string;
    text: string;
    progress: string;
  };
}

interface ClassItem {
  id: string;
  modalidade: string;
  modalidadeId: number; // Mantemos isso pois é parte da API de resposta
  numAulas: number;
  totalAlunos: number; // Alterado de mediaAlunos para totalAlunos
  receita: number;
  custo: number;
  resultado: number;
  ocupacao: number;
}

type ScheduleGrid = {
  [horario: string]: {
    [diaSemana: string]: ClassItem[];
  };
};

interface AnalysisTabProps {
  mesAno: string;
  termo?: string;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ 
  mesAno, 
  termo 
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Construir a query com parâmetros de filtro
  const buildQueryKey = () => {
    // Agora apenas incluímos o parâmetro mesAno, pois os filtros modalidadeId e professorId foram removidos
    // Os filtros por termo são aplicados apenas no cliente após receber os dados
    return `/api/dashboard/horarios-aulas?mesAno=${mesAno}`;
  };

  const { data: gridData, isLoading, isError } = useQuery<ScheduleGrid>({
    queryKey: [buildQueryKey()],
  });
  
  // Define as cores para as modalidades
  const modalidadeColors: ModalidadeColors = {
    'AlongaMente': {
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-200',
      text: 'text-blue-800',
      progress: 'bg-blue-300',
    },
    'Yoga': {
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-200',
      text: 'text-purple-800',
      progress: 'bg-purple-300',
    },
    'Pilates': {
      bg: 'bg-green-100',
      border: 'border-green-200',
      hover: 'hover:bg-green-200',
      text: 'text-green-800',
      progress: 'bg-green-300',
    },
    'Musculação': {
      bg: 'bg-red-100',
      border: 'border-red-200',
      hover: 'hover:bg-red-200',
      text: 'text-red-800',
      progress: 'bg-red-300',
    },
    'Zumba': {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      hover: 'hover:bg-yellow-200',
      text: 'text-yellow-800',
      progress: 'bg-yellow-300',
    },
    'default': {
      bg: 'bg-gray-100',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-800',
      progress: 'bg-gray-300',
    }
  };

  // Função para aplicar os filtros de texto aos dados da grade
  // Aplicamos apenas filtragem por termo de busca no lado do cliente
  const filtrarDados = (dados: ScheduleGrid | undefined): ScheduleGrid => {
    if (!dados) return {};
    
    // Se não tem filtro de texto, retorna os dados originais
    if (!termo || termo.trim() === "") {
      return dados;
    }
    
    const dadosFiltrados: ScheduleGrid = {};
    const termoLowerCase = termo.toLowerCase().trim();
    
    // Para cada horário na grade
    Object.keys(dados).forEach(horario => {
      dadosFiltrados[horario] = {};
      
      // Para cada dia da semana nesse horário
      Object.keys(dados[horario]).forEach(diaSemana => {
        // Filtrar as aulas desse dia/horário pelo termo de busca
        const aulasFiltradas = dados[horario][diaSemana].filter(aula => {
          const modalidadeLowerCase = aula.modalidade.toLowerCase();
          return modalidadeLowerCase.includes(termoLowerCase);
        });
        
        // Só adicionar dias/horários que têm aulas após a filtragem
        if (aulasFiltradas.length > 0) {
          dadosFiltrados[horario][diaSemana] = aulasFiltradas;
        }
      });
      
      // Remover horários sem nenhum dia da semana
      if (Object.keys(dadosFiltrados[horario]).length === 0) {
        delete dadosFiltrados[horario];
      }
    });
    
    return dadosFiltrados;
  };

  // Aplicar filtros e calcular dados derivados usando useMemo para evitar re-cálculos desnecessários
  const {
    dadosFiltrados,
    temResultados,
    diasSemana,
    horarios
  } = useMemo(() => {
    const dadosFiltrados = filtrarDados(gridData);
    const temResultados = Object.keys(dadosFiltrados).length > 0;
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const horarios = Object.keys(dadosFiltrados).sort();
    
    return {
      dadosFiltrados,
      temResultados,
      diasSemana,
      horarios
    };
  }, [gridData, termo]);

  const openModal = (classData: ClassItem) => {
    setSelectedClass(classData);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="text-lg font-medium">Ocorreu um erro ao carregar os dados</p>
        <p className="text-sm">Por favor, tente novamente mais tarde</p>
      </div>
    );
  }
  
  if (!gridData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }
  
  // Mensagem quando não há resultados para o filtro de termo aplicado
  if (!temResultados && (termo && termo.trim() !== "")) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        <p>Nenhuma modalidade encontrada para o termo de busca "{termo}".</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-primary section-title">Análise Financeira por Dia e Horário</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize o desempenho financeiro das aulas por dia da semana e horário
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="w-20 p-2 bg-muted border border-border text-left text-xs font-bold text-primary uppercase"></th>
              {diasSemana.map((dia) => (
                <th key={dia} className="p-2 bg-muted border border-border text-center text-xs font-bold text-primary uppercase">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map((horario) => (
              <tr key={horario}>
                <td className="p-2 border border-border text-sm font-medium text-primary bg-muted">
                  {horario}
                </td>
                {diasSemana.map((dia) => {
                  const cellDataArray = dadosFiltrados[horario]?.[dia] || [];
                  
                  return (
                    <td key={`${horario}-${dia}`} className="p-2 border border-border align-top h-auto relative">
                      {cellDataArray && cellDataArray.length > 0 ? (
                        <div className="grid gap-2">
                          {cellDataArray.map((cellData, index) => (
                            <div 
                              key={`${cellData.id}-${index}`}
                              onClick={() => openModal(cellData)}
                              className={`cursor-pointer border rounded-lg p-3 transition
                                         ${cellData.resultado >= 0 
                                           ? 'bg-green-100/80 hover:bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                                           : 'bg-red-100/80 hover:bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'}`}
                            >
                              <div className="flex flex-col">
                                <h5 className="text-sm font-semibold text-primary">
                                  {cellData.modalidade}
                                </h5>
                                
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                  <div className="flex justify-between">
                                    <span>Aulas:</span>
                                    <span className="font-medium">{cellData.numAulas}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Alunos:</span>
                                    <span className="font-medium">{cellData.totalAlunos}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Média/Aula:</span>
                                    <span className="font-medium">{(cellData.totalAlunos / cellData.numAulas).toFixed(1).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Receita:</span>
                                    <span className="font-medium">R$ {cellData.receita.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Custo:</span>
                                    <span className="font-medium">R$ {cellData.custo.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex justify-between mt-1 text-primary text-xs font-bold">
                                    <span>Resultado:</span>
                                    <span className={cellData.resultado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                      R$ {cellData.resultado.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                  <div 
                                    className={`h-full ${cellData.ocupacao >= 70 ? 'bg-green-500' : cellData.ocupacao >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(cellData.ocupacao, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="mt-1 text-xs text-right text-gray-600 dark:text-gray-400">
                                  Ocupação: {cellData.ocupacao.toFixed(1).replace('.', ',')}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedClass && (
        <ClassDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          classItem={selectedClass}
          mesAno={mesAno}
        />
      )}
    </div>
  );
};

export default AnalysisTab;