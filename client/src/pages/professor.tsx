import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateMonthYearOptions } from "@/app-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/utils/format-date";

interface Professor {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  mediaAlunos: number;
  valorReceber: number;
}

interface Aula {
  id: number;
  data: string;
  horaInicio: string;
  modalidade: string;
  cargo: string;
  patente: string;
  alunosPresentes: number;
  capacidade: number;
}

export default function ProfessorDetails() {
  const { id } = useParams();
  const professorId = parseInt(id);
  const [currentTab, setCurrentTab] = useState("visao-geral");
  const { toast } = useToast();
  
  // Estado para armazenar mês/ano atual
  const [currentMonthYear, setCurrentMonthYear] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
      label: `${now.toLocaleString('pt-BR', { month: 'long' })}/${now.getFullYear()}`
    };
  });
  
  // Opções de mês/ano para o seletor
  const monthYearOptions = generateMonthYearOptions(12);

  // Carregar dados do professor
  const { data: professor, isLoading: isLoadingProfessor } = useQuery<Professor>({
    queryKey: [`/api/professores/${professorId}?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`],
    enabled: !!professorId
  });

  // Carregar aulas do professor
  const { data: aulas, isLoading: isLoadingAulas } = useQuery<Aula[]>({
    queryKey: [`/api/professores/${professorId}/aulas?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`],
    enabled: !!professorId
  });

  if (isLoadingProfessor || isLoadingAulas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Professor não encontrado</h1>
        <Link href="/professores">
          <Button>Voltar para lista de professores</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="bg-card shadow-sm dark:border-b dark:border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/professores" className="flex items-center text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Professores
            </Link>
            <h2 className="text-xl font-semibold text-primary">Perfil de Professor</h2>
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
                <SelectTrigger className="bg-background border border-input text-foreground py-2 px-4 rounded-md focus:outline-none focus:ring-primary focus:border-primary w-44">
                  <SelectValue placeholder={currentMonthYear.label} />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {monthYearOptions.map((option) => (
                    <SelectItem 
                      key={`${option.month}-${option.year}`} 
                      value={`${option.month}-${option.year}`}
                      className="select-item"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Detalhes do professor */}
          <Card className="md:w-1/3 dark:bg-card dark:border-border">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="bg-primary h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {professor.nome.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-xl dark:text-white">{professor.nome}</CardTitle>
                  <CardDescription className="dark:text-gray-400">{professor.email || "Sem email cadastrado"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-md dark:bg-card dark:border dark:border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total de Aulas</p>
                    <p className="text-2xl font-bold text-primary">{professor.totalAulas}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md dark:bg-card dark:border dark:border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total de Alunos</p>
                    <p className="text-2xl font-bold text-primary">{professor.totalAlunos}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md dark:bg-card dark:border dark:border-border">
                    <p className="text-sm text-muted-foreground mb-1">Média de Alunos</p>
                    <p className="text-2xl font-bold text-primary">{professor.mediaAlunos}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md dark:bg-card dark:border dark:border-border">
                    <p className="text-sm text-muted-foreground mb-1">Valor a Receber</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {Number(professor.valorReceber).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Abas para aulas e outros dados */}
          <div className="md:w-2/3">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="aulas">Aulas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visao-geral">
                <Card className="dark:bg-card dark:border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Desempenho do Professor</CardTitle>
                    <CardDescription>
                      Resumo de desempenho para {currentMonthYear.label || `${new Date().toLocaleString('pt-BR', { month: 'long' })}/${new Date().getFullYear()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-md dark:bg-card dark:border dark:border-border">
                        <h3 className="text-lg font-medium mb-2 dark:text-white">Resumo Financeiro</h3>
                        <p className="text-muted-foreground dark:text-gray-400 mb-4">
                          Valor total a receber: <span className="font-bold text-green-600 dark:text-green-400">
                            R$ {Number(professor.valorReceber).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          Este valor é calculado com base nas aulas ministradas, cargo, patente e quantidade de alunos presentes.
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-md dark:bg-card dark:border dark:border-border">
                        <h3 className="text-lg font-medium mb-2 dark:text-white">Estatísticas</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">Total de Aulas</p>
                            <p className="text-lg font-bold dark:text-white">{professor.totalAulas}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">Total de Alunos</p>
                            <p className="text-lg font-bold dark:text-white">{professor.totalAlunos}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">Média de Alunos</p>
                            <p className="text-lg font-bold dark:text-white">{professor.mediaAlunos}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">Taxa de Ocupação</p>
                            <p className="text-lg font-bold dark:text-white">
                              {professor.totalAulas > 0 
                                ? `${Math.round((professor.totalAlunos / (professor.totalAulas * 15)) * 100)}%` 
                                : '0%'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="aulas">
                <Card className="dark:bg-card dark:border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Aulas do Professor</CardTitle>
                    <CardDescription>
                      Lista de aulas ministradas em {currentMonthYear.label || `${new Date().toLocaleString('pt-BR', { month: 'long' })}/${new Date().getFullYear()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aulas && aulas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-primary">Data</TableHead>
                              <TableHead className="text-primary">Hora</TableHead>
                              <TableHead className="text-primary">Modalidade</TableHead>
                              <TableHead className="text-primary">Cargo</TableHead>
                              <TableHead className="text-primary">Patente</TableHead>
                              <TableHead className="text-primary">Alunos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aulas.map((aula) => (
                              <TableRow key={aula.id}>
                                <TableCell className="dark:text-white">
                                  {formatDate(aula.data) || 'Data não disponível'}
                                </TableCell>
                                <TableCell className="dark:text-white">{aula.horaInicio}</TableCell>
                                <TableCell className="dark:text-white">{aula.modalidade}</TableCell>
                                <TableCell className="dark:text-white">{aula.cargo}</TableCell>
                                <TableCell className="dark:text-white">{aula.patente}</TableCell>
                                <TableCell className="dark:text-white">
                                  {aula.alunosPresentes}/{aula.capacidade}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground dark:text-gray-400">
                          Nenhuma aula encontrada para este período.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}