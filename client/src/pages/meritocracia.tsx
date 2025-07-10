import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/format-date';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipo para os detalhes do professor na tela de meritocracia
interface Professor {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  valorMeritocracia: number;
}

// Tipo para detalhes de um professor específico
interface ProfessorDetalhes {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  valorPatente: number; // Mantivemos apenas a informação de meritocracia (valorPatente)
  mesAno: string;
  aulas: AulaDetalhe[];
}

interface AulaDetalhe {
  id: number;
  data: string;
  dataOriginal: string;
  horaInicio: string;
  modalidade: string;
  cargo: string;
  patente: string;
  capacidade: number;
  alunosPresentes: number;
  multiplicador: number;
  valorAula: number;
}

const Meritocracia: React.FC = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [professorSelecionado, setProfessorSelecionado] = useState<number | null>(null);
  
  // Se for professor, mostrar diretamente seus dados
  useEffect(() => {
    if (!isAdmin && user) {
      setProfessorSelecionado(user.id);
    }
  }, [user, isAdmin]);
  
  // Usar a data atual como mês/ano padrão
  const dataAtual = new Date();
  const [mesAno, setMesAno] = useState({
    month: dataAtual.getMonth(),
    year: dataAtual.getFullYear(),
    label: dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  });

  // Consulta para obter a lista de professores com métricas de meritocracia
  const { data: professores, isLoading } = useQuery<Professor[]>({
    queryKey: ['/api/meritocracia/professores', `${mesAno.month + 1}/${mesAno.year}`],
    queryFn: async () => {
      const res = await fetch(`/api/meritocracia/professores?mesAno=${mesAno.month + 1}/${mesAno.year}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar dados de meritocracia');
      }
      return await res.json();
    }
  });

  // Consulta para obter os detalhes do professor selecionado
  const { data: professorDetalhes, isLoading: isLoadingDetalhes } = useQuery<ProfessorDetalhes>({
    queryKey: ['/api/meritocracia/professor', professorSelecionado, `${mesAno.month + 1}/${mesAno.year}`],
    queryFn: async () => {
      if (!professorSelecionado) return null;
      
      const res = await fetch(`/api/meritocracia/professor/${professorSelecionado}?mesAno=${mesAno.month + 1}/${mesAno.year}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar detalhes do professor');
      }
      return await res.json();
    },
    enabled: !!professorSelecionado
  });

  // Função para selecionar um professor e mostrar seus detalhes
  const selecionarProfessor = (id: number) => {
    setProfessorSelecionado(id);
  };

  // Função para voltar à lista de professores
  const voltarLista = () => {
    setProfessorSelecionado(null);
  };

  // Função para formatar valores monetários
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para gerar o PDF com os dados de todos os professores
  const gerarPDFTodosProfessores = () => {
    if (!professores || professores.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há professores com dados de meritocracia neste período.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar um novo documento PDF
      const doc = new jsPDF();
      
      // Configurações de fonte e cores
      doc.setTextColor(33, 33, 33);
      doc.setFont("helvetica", "bold");
      
      // Título do documento
      doc.setFontSize(18);
      doc.text(`Relatório de Meritocracia – Todos os Professores`, 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data de geração: ${dataAtual}`, 14, 28);
      
      // Período de referência
      doc.text(`Período de referência: ${mesAno.month + 1}/${mesAno.year}`, 14, 34);
      
      // Resumo geral
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Geral", 14, 44);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const totalAulas = professores.reduce((total, professor) => total + professor.totalAulas, 0);
      const totalAlunos = professores.reduce((total, professor) => total + professor.totalAlunos, 0);
      const totalMeritocracia = professores.reduce((total, professor) => total + professor.valorMeritocracia, 0);
      
      doc.text(`Total de aulas ministradas: ${totalAulas}`, 14, 52);
      doc.text(`Total de alunos atendidos: ${totalAlunos}`, 14, 58);
      doc.text(`Valor Total de Meritocracia: ${formatarValor(totalMeritocracia)}`, 14, 64);
      
      // Dados para a tabela
      const professoresData = professores.map(professor => [
        professor.nome,
        professor.totalAulas.toString(),
        professor.totalAlunos.toString(),
        formatarValor(professor.valorMeritocracia)
      ]);
      
      // Configuração da tabela
      autoTable(doc, {
        startY: 74,
        head: [['Professor', 'Total Aulas', 'Total Alunos', 'Valor Meritocracia']],
        body: professoresData,
        headStyles: {
          fillColor: [255, 102, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          fontSize: 10,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left' },
          3: { halign: 'right' }
        },
        margin: 15
      });
      
      // Adicionar rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center'
        });
      }
      
      // Salvar o PDF
      const nomeArquivo = `relatorio-meritocracia-todos-professores-${mesAno.month + 1}-${mesAno.year}.pdf`;
      doc.save(nomeArquivo);
      
      toast({
        title: "Relatório de meritocracia gerado com sucesso!",
        description: "O PDF com dados de todos os professores foi baixado para o seu computador.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para gerar o PDF com os dados detalhados de um professor específico
  const gerarPDF = () => {
    if (!professorDetalhes) return;

    try {
      try {
        // Criar um novo documento PDF
        const doc = new jsPDF();
        
        // Configurações de fonte e cores
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        
        // Título do documento
        doc.setFontSize(18);
        doc.text(`Relatório de Meritocracia – ${professorDetalhes.nome}`, 14, 20);
        
        // Data de geração
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        doc.text(`Data de geração: ${dataAtual}`, 14, 28);
        
        // Período de referência
        doc.text(`Período de referência: ${professorDetalhes.mesAno}`, 14, 34);
        
        // Resumo
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo", 14, 44);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Total de aulas ministradas: ${professorDetalhes.totalAulas}`, 14, 52);
        doc.text(`Total de alunos atendidos: ${professorDetalhes.totalAlunos}`, 14, 58);
        doc.text(`Valor Meritocracia: ${formatarValor(professorDetalhes.valorPatente)}`, 14, 64);
        
        // Detalhamento das aulas
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhamento das Aulas", 14, 74);
        
        // Verificar se há aulas para exibir
        if (professorDetalhes.aulas && professorDetalhes.aulas.length > 0) {
          // Dados para a tabela
          const aulasData = professorDetalhes.aulas.map(aula => [
            formatDate(aula.data),
            aula.horaInicio,
            aula.modalidade,
            aula.patente,
            `${aula.alunosPresentes}/${aula.capacidade}`,
            formatarValor(aula.valorAula)
          ]);
          
          // Configuração da tabela
          autoTable(doc, {
            startY: 80,
            head: [['Data', 'Horário', 'Modalidade', 'Patente', 'Alunos', 'Valor (R$)']],
            body: aulasData,
            headStyles: {
              fillColor: [255, 102, 0],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            styles: {
              fontSize: 10,
              halign: 'center'
            },
            margin: 15 // Usar margens numéricas em vez de strings
          });
        } else {
          // Se não houver aulas, adicionar uma mensagem
          doc.setFontSize(11);
          doc.setFont("helvetica", "italic");
          doc.text("Nenhuma aula encontrada para este período.", 14, 84);
        }
        
        // Adicionar rodapé apenas se houver páginas
        try {
          const totalPages = doc.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
              align: 'center'
            });
          }
        } catch (err) {
          console.log("Erro ao adicionar rodapé:", err);
        }
        
        // Salvar o PDF com tratamento de erro para caracteres especiais
        const nomeArquivo = `relatorio-meritocracia-${professorDetalhes.id}-${professorDetalhes.mesAno.replace('/', '-')}.pdf`;
        doc.save(nomeArquivo);
      } catch (err) {
        console.error("Erro detalhado ao gerar PDF:", err);
        throw new Error("Falha ao gerar PDF");
      }
      
      toast({
        title: "Relatório de meritocracia gerado com sucesso!",
        description: "O PDF foi baixado para o seu computador.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Renderização da lista de professores (tela inicial)
  if (!professorSelecionado) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Meritocracia</h1>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={gerarPDFTodosProfessores} 
              disabled={isLoading || !professores || professores.length === 0}
              variant="outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Relatório PDF
            </Button>
            <div className="text-sm text-muted-foreground">
              {mesAno.label}
            </div>
            <Select
              value={`${mesAno.month}-${mesAno.year}`}
              onValueChange={(value) => {
                const [month, year] = value.split('-').map(Number);
                // Atualizar o estado local
                const date = new Date(year, month);
                setMesAno({
                  month,
                  year,
                  label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => {
                  const month = i;
                  const year = mesAno.year;
                  const date = new Date(year, month);
                  return (
                    <SelectItem key={`${month}-${year}`} value={`${month}-${year}`}>
                      {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Card com o total de meritocracia */}
        <Card className="mb-6">
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <p className="text-muted-foreground">Total de Meritocracia</p>
                <div className="text-3xl font-bold text-orange-500">
                  {isLoading 
                    ? <Skeleton className="h-8 w-32" /> 
                    : formatarValor(professores?.reduce((total, professor) => total + professor.valorMeritocracia, 0) || 0)
                  }
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-sm text-muted-foreground">
                  Período: {mesAno.month + 1}/{mesAno.year}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Professores</span>
              <span className="text-sm text-muted-foreground">
                {mesAno.month + 1}/{mesAno.year}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Total Aulas</TableHead>
                    <TableHead className="text-right">Total Alunos</TableHead>
                    <TableHead className="text-right">Valor Meritocracia</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professores?.length ? (
                    professores.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell className="font-medium">{professor.nome}</TableCell>
                        <TableCell className="text-right">{professor.totalAulas}</TableCell>
                        <TableCell className="text-right">{professor.totalAlunos}</TableCell>
                        <TableCell className="text-right">{formatarValor(professor.valorMeritocracia)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => selecionarProfessor(professor.id)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum professor encontrado para este período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderização dos detalhes do professor
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={voltarLista} className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Voltar
            </Button>
          )}
          <h1 className="text-2xl font-bold text-primary">Meritocracia - {isLoadingDetalhes ? "Carregando..." : professorDetalhes?.nome}</h1>
        </div>
        <Button onClick={gerarPDF} disabled={isLoadingDetalhes || !professorDetalhes}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar Relatório
        </Button>
      </div>

      {isLoadingDetalhes ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : professorDetalhes ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{professorDetalhes.totalAulas}</div>
                <p className="text-muted-foreground">Total de Aulas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{professorDetalhes.totalAlunos}</div>
                <p className="text-muted-foreground">Total de Alunos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-500">{formatarValor(professorDetalhes.valorPatente)}</div>
                <p className="text-muted-foreground">Meritocracia</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento das Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Patente</TableHead>
                    <TableHead className="text-right">Alunos</TableHead>
                    <TableHead className="text-right">Multiplicador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professorDetalhes.aulas.length ? (
                    professorDetalhes.aulas.map((aula) => (
                      <TableRow key={aula.id}>
                        <TableCell>{formatDate(aula.data)}</TableCell>
                        <TableCell>{aula.horaInicio}</TableCell>
                        <TableCell>{aula.modalidade}</TableCell>
                        <TableCell>{aula.cargo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {aula.patente}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{aula.alunosPresentes}/{aula.capacidade}</TableCell>
                        <TableCell className="text-right">{aula.multiplicador.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{formatarValor(aula.valorAula)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Nenhuma aula encontrada para este professor no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Erro ao carregar detalhes do professor</p>
        </div>
      )}
    </div>
  );
};

export default Meritocracia;