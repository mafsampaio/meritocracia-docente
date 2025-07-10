import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface ClassItem {
  id: string;
  modalidade: string;
  numAulas: number;
  totalAlunos: number;
  receita: number;
  custo: number;
  resultado: number;
  ocupacao: number;
}

interface ClassDetailData {
  info: {
    modalidade: string;
    diaSemana: string;
    horario: string;
    capacidade: number;
    capacidadeTotal: number;
    mediaAlunos: number;
    ocupacao: number;
    totalAulas: number;
    totalCheckins: number;
  };
  valores: {
    mediaReceitaPorAula: number;
    mediaCustoPorAula: number;
    receitaMensal: number;
    custoMensal: number;
    resultadoMensal: number;
  };
  aulas: Array<{
    data: string;
    alunos: number;
    receita: number;
    custo: number;
    resultado: number;
  }>;
  professores: Array<{
    id: number;
    nome: string;
    cargo: string;
    patente: string;
    valorHora: number;
    multiplicadorAluno: number;
    valorTotal: number;
  }>;
}

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem;
  mesAno: string;
}

const ClassDetailModal: React.FC<ClassDetailModalProps> = ({ isOpen, onClose, classItem, mesAno }) => {
  const { data, isLoading } = useQuery<ClassDetailData>({
    queryKey: [`/api/dashboard/detalhes-aula/${classItem.id}?mesAno=${mesAno}`],
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-primary section-title">
            {isLoading 
              ? "Carregando detalhes..." 
              : `Detalhes da Aula: ${data?.info.modalidade} - ${data?.info.diaSemana}, ${data?.info.horario}`
            }
          </h3>
          <button className="text-muted-foreground hover:text-primary" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-40 bg-gray-100 rounded"></div>
                <div className="h-40 bg-gray-100 rounded"></div>
              </div>
              <div className="h-60 bg-gray-100 rounded mt-4"></div>
            </div>
          </div>
        ) : data ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-primary modal-subtitle mb-2">INFORMAÇÕES DA AULA</h4>
                <div className="bg-gray-50 dark:bg-background border dark:border-border p-4 rounded-lg info-box">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Modalidade</p>
                      <p className="font-medium">{data.info.modalidade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dia da Semana</p>
                      <p className="font-medium">{data.info.diaSemana}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Horário</p>
                      <p className="font-medium">{data.info.horario}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Capacidade por Aula</p>
                      <p className="font-medium">{data.info.capacidade} alunos</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Capacidade Total</p>
                      <p className="font-medium">{data.info.capacidadeTotal || (data.info.capacidade * data.info.totalAulas)} alunos</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total de Aulas</p>
                      <p className="font-medium">{data.info.totalAulas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total de Check-ins</p>
                      <p className="font-medium">{data.info.totalCheckins}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Média de Alunos</p>
                      <p className="font-medium">{data.info.mediaAlunos} alunos</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Taxa de Ocupação</p>
                      <p className="font-medium">{data.info.ocupacao}%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-primary modal-subtitle mb-2">VALORES</h4>
                <div className="bg-gray-50 dark:bg-background border dark:border-border p-4 rounded-lg info-box">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Média de Receita por Aula</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        R$ {(data.valores.mediaReceitaPorAula || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Média de Custo por Aula</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        R$ {(data.valores.mediaCustoPorAula || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Receita Mensal</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        R$ {(data.valores.receitaMensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Custo Mensal</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        R$ {(data.valores.custoMensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-primary info-label">Resultado Mensal</p>
                      <p className={`font-medium ${(data.valores.resultadoMensal || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        R$ {(data.valores.resultadoMensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-primary modal-subtitle mb-2">AULAS DO MÊS</h4>
              <div className="bg-gray-50 dark:bg-background border dark:border-border p-4 rounded-lg info-box">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Alunos</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Receita</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Custo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.aulas.map((aula, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm table-cell">{aula.data}</td>
                        <td className="px-4 py-2 text-sm table-cell">{aula.alunos}</td>
                        <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400 table-cell">
                          R$ {(aula.receita || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400 table-cell">
                          R$ {(aula.custo || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className={`px-4 py-2 text-sm ${(aula.resultado || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} table-cell`}>
                          {(aula.resultado || 0) >= 0 ? '+' : ''}R$ {(aula.resultado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-primary modal-subtitle mb-2">PROFESSORES</h4>
              <div className="bg-gray-50 dark:bg-background border dark:border-border p-4 rounded-lg info-box">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Professor</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Cargo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Patente</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Valor Hora</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Multi. Aluno</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary table-header">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.professores.map((professor) => (
                      <tr key={professor.id}>
                        <td className="px-4 py-2 text-sm table-cell">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-2">
                              <span>{professor.nome?.charAt(0) || '?'}</span>
                            </div>
                            <span>{professor.nome || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm table-cell">{professor.cargo || '-'}</td>
                        <td className="px-4 py-2 text-sm table-cell">{professor.patente || '-'}</td>
                        <td className="px-4 py-2 text-sm table-cell">
                          R$ {(professor.valorHora || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-2 text-sm table-cell">
                          R$ {(professor.multiplicadorAluno || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium table-cell">
                          R$ {(professor.valorTotal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-red-500">
            Não foi possível carregar os detalhes da aula.
          </div>
        )}
        
        <div className="p-4 border-t border-border flex justify-end">
          <button 
            className="bg-primary hover:bg-opacity-90 text-white px-6 py-2 rounded-md transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailModal;
