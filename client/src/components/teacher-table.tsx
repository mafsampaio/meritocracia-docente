import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface TeacherSummary {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  mediaAlunos: number;
  valorReceber: number;
}

interface TeacherTableProps {
  mesAno: string;
  limit?: number;
  showViewAllLink?: boolean;
}

const TeacherTable: React.FC<TeacherTableProps> = ({ 
  mesAno, 
  limit = 3, 
  showViewAllLink = true 
}) => {
  const { data, isLoading } = useQuery<TeacherSummary[]>({
    queryKey: [`/api/professores/destaques?mesAno=${mesAno}&limit=${limit}`],
  });

  // Função para gerar uma cor de fundo com base no ID do professor
  const getAvatarColor = (id: number) => {
    const colors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning'];
    return colors[id % colors.length];
  };

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary title">Professores em Destaque</h3>
        {showViewAllLink && (
          <Link href="/professores" className="text-primary hover:text-orange-400 text-sm action-link">
            Ver todos
          </Link>
        )}
      </div>
      
      <div className="p-4">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="animate-pulse">
              {[...Array(limit)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4">
                  <div className="rounded-full h-10 w-10 bg-muted"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <table className="min-w-full divide-y divide-border teacher-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Professor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Total de Aulas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Total de Alunos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Média de Alunos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Valor a Receber
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(teacher.id)} text-white flex items-center justify-center font-bold`}>
                          <span>{teacher.nome.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{teacher.nome}</div>
                          <div className="text-sm text-gray-400">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{teacher.totalAulas}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{teacher.totalAlunos}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{teacher.mediaAlunos}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium value-money">
                      R$ {teacher.valorReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/professor/${teacher.id}`} className="text-primary hover:text-orange-400 mr-3 details-link">
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-gray-400">
              Nenhum professor encontrado para este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTable;
