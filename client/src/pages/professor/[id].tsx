import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Função para criar o label no formato Mês/Ano
const createMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month]}/${year}`;
};

// Função para gerar opções de mês/ano para o select
const generateMonthYearOptions = (monthsBack = 12) => {
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

interface ProfessorDetailProps {
  id: string;
}

interface ProfessorInfo {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  mediaAlunos: number;
  valorReceber: number;
}

interface ProfessorAula {
  id: number;
  data: string;
  horaInicio: string;
  modalidade: string;
  cargo: string;
  patente: string;
  valorHora: number;
  multiplicadorAluno: number;
  quantidadeAlunos: number;
  valorTotal: number;
}

const ProfessorDetail: React.FC<ProfessorDetailProps> = ({ id }) => {
  const professorId = parseInt(id);
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
    label: createMonthYearLabel(today.getMonth(), today.getFullYear())
  });
  const monthYearOptions = generateMonthYearOptions();
  
  // Verificar se o usuário tem permissão para ver esta página
  React.useEffect(() => {
    if (user && !isAdmin && user.id !== professorId) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive"
      });
      setLocation('/');
    }
  }, [user, isAdmin, professorId, toast, setLocation]);

  // Buscar detalhes do professor
  const { data: professor, isLoading: professorLoading } = useQuery<ProfessorInfo>({
    queryKey: [`/api/professores/${professorId}?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`],
    enabled: !!professorId,
  });

  // Buscar aulas do professor
  const { data: aulas, isLoading: aulasLoading } = useQuery<ProfessorAula[]>({
    queryKey: [`/api/professores/${professorId}/aulas?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`],
    enabled: !!professorId,
  });

  if (professorLoading) {
    return (
      <>
        <header className="bg-card shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className="h-8 bg-muted rounded w-40 animate-pulse"></div>
            </div>
          </div>
        </header>
        <div className="space-y-6 animate-pulse">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </>
    );
  }

  if (!professor) {
    return (
      <>
        <header className="bg-card shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">Professor não encontrado</h2>
            </div>
          </div>
        </header>
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow p-6 text-center">
            <p className="text-muted-foreground">O professor solicitado não foi encontrado ou você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Perfil do Professor</h2>
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
                <SelectTrigger className="w-44">
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
        {/* Resumo do Professor */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mr-4">
                <span>{professor.nome.charAt(0)}</span>
              </div>
              <div>
                <CardTitle className="text-2xl">{professor.nome}</CardTitle>
                <p className="text-muted-foreground">{professor.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de Aulas</p>
                <p className="text-xl font-semibold">{professor.totalAulas}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de Alunos</p>
                <p className="text-xl font-semibold">{professor.totalAlunos}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Média de Alunos/Aula</p>
                <p className="text-xl font-semibold">{professor.mediaAlunos}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Valor a Receber</p>
                <p className="text-xl font-semibold text-green-600">
                  R$ {professor.valorReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Detalhes */}
        <Tabs defaultValue="aulas" className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px] mb-4">
            <TabsTrigger value="aulas">Aulas</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="aulas" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Aulas do Período</CardTitle>
              </CardHeader>
              <CardContent>
                {aulasLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-12 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : aulas && aulas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Data</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Modalidade</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Cargo / Patente</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Alunos</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Valores</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aulas.map((aula) => (
                          <tr key={aula.id} className="border-t border-border hover:bg-muted/50">
                            <td className="py-3 text-sm">{aula.data} {aula.horaInicio}</td>
                            <td className="py-3 text-sm">{aula.modalidade}</td>
                            <td className="py-3 text-sm">
                              <div className="flex flex-col">
                                <Badge className="mb-1 inline-flex w-fit" variant="outline">{aula.cargo}</Badge>
                                <Badge className="inline-flex w-fit" variant="outline">{aula.patente}</Badge>
                              </div>
                            </td>
                            <td className="py-3 text-sm">{aula.quantidadeAlunos}</td>
                            <td className="py-3 text-sm">
                              <div className="flex flex-col">
                                <span>Hora: R$ {aula.valorHora.toFixed(2)}</span>
                                <span>Mult: R$ {aula.multiplicadorAluno.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm font-medium text-green-600">
                              R$ {aula.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhuma aula encontrada para este período.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="estatisticas" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do Professor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Distribuição de Modalidades</h3>
                    {!aulasLoading && aulas && aulas.length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(
                          aulas.reduce((acc, aula) => {
                            acc[aula.modalidade] = (acc[aula.modalidade] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([modalidade, count]) => {
                          const percentage = (count / aulas.length) * 100;
                          return (
                            <div key={modalidade}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">{modalidade}</span>
                                <span className="text-sm font-medium">{count} aulas ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-background rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Sem dados para exibir.
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Cargos e Patentes</h3>
                    {!aulasLoading && aulas && aulas.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm text-muted-foreground mb-2">Cargos</h4>
                          <div className="space-y-2">
                            {Object.entries(
                              aulas.reduce((acc, aula) => {
                                acc[aula.cargo] = (acc[aula.cargo] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([cargo, count]) => (
                              <div key={cargo} className="flex justify-between items-center">
                                <span>{cargo}</span>
                                <Badge variant="outline">{count} aulas</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm text-muted-foreground mb-2">Patentes</h4>
                          <div className="space-y-2">
                            {Object.entries(
                              aulas.reduce((acc, aula) => {
                                acc[aula.patente] = (acc[aula.patente] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([patente, count]) => (
                              <div key={patente} className="flex justify-between items-center">
                                <span>{patente}</span>
                                <Badge variant="outline">{count} aulas</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Sem dados para exibir.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfessorDetail;
