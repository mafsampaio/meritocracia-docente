import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/utils/format-date';
// Removida dependência do contexto da aplicação

// Ícones
import { 
  Users, 
  UserCheck, 
  Award, 
  Activity, 
  Zap, 
  Search, 
  FileText, 
  ChevronRight, 
  Download,
  DollarSign,
  Calendar,
  Clock,
  BarChart2
} from 'lucide-react';

interface Professor {
  id: number;
  nome: string;
  totalAulas: number;
  totalPresencas: number;
  media: number;
  totalGanhos: number;
  ocupacao: number;
  cargo: string;
  patente: string;
  valorCargo?: number;
  valorPatente?: number;
}

interface Aula {
  id: number;
  data: string;
  horaInicio: string;
  modalidade: string;
  alunosPresentes: number;
  valor: number;
  cargo: string;
}

interface Modalidade {
  nome: string;
  totalAulas: number;
  mediaAlunos: number;
  ocupacao: number;
  valorTotal: number;
}

interface DetalheProfessor {
  id: number;
  nome: string;
  cargo: string;
  patente: string;
  totalAulas: number;
  totalPresencas: number;
  mediaAlunos: number;
  ocupacao: number;
  valorCargo: number; // Valor total do cargo
  valorPatente: number; // Valor total da patente (meritocracia)
  totalGanhos: number;
  aulas: Aula[];
  modalidades: Modalidade[];
}

const AnaliseHorariosPage: React.FC = () => {
  const { toast } = useToast();
  
  // Usar um estado local para substituir o context
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonthLabel, setCurrentMonthLabel] = useState<string>(() => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[new Date().getMonth()]}/${new Date().getFullYear()}`;
  });
  
  // Criar objeto simulando a estrutura do contexto
  const currentMonthYear = {
    month: currentMonth,
    year: currentYear,
    label: currentMonthLabel
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filteredProfessores, setFilteredProfessores] = useState<Professor[]>([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(null);

  // Buscar os dados dos professores
  const { 
    data: professorData, 
    isLoading: isLoadingProfessores,
    error: professorError 
  } = useQuery({
    queryKey: ['/api/analise-professores', currentMonthYear],
    queryFn: async () => {
      const response = await fetch(`/api/analise-professores?mesAno=${currentMonthYear.month}/${currentMonthYear.year}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados dos professores');
      }
      return response.json();
    }
  });

  // Buscar detalhes de um professor específico quando selecionado
  const { 
    data: detalheProfessor, 
    isLoading: isLoadingDetalhe,
    error: detalheError,
    refetch: refetchDetalhe
  } = useQuery({
    queryKey: ['/api/analise-professores/detalhe', selectedProfessorId, currentMonthYear],
    queryFn: async () => {
      if (!selectedProfessorId) return null;
      
      const response = await fetch(
        `/api/analise-professores/detalhe/${selectedProfessorId}?mesAno=${currentMonthYear.month}/${currentMonthYear.year}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do professor');
      }
      
      return response.json();
    },
    enabled: !!selectedProfessorId
  });

  // Estatísticas calculadas
  const [estatisticas, setEstatisticas] = useState({
    totalProfessores: 0,
    totalGanhos: 0,
    totalValorCargo: 0, // Valor total de horas aula (cargo)
    totalValorPatente: 0, // Valor total de meritocracia (patente)
    mediaOcupacao: 0,
    mediaPresencas: 0,
    totalAulas: 0,       // Para referência, ainda que possa não ser preciso
    totalPresencas: 0    // Para referência, ainda que possa não ser preciso
  });

  // Filtrar professores com base na pesquisa e calcular estatísticas
  useEffect(() => {
    if (!professorData) {
      setFilteredProfessores([]);
      setEstatisticas({
        totalProfessores: 0,
        totalGanhos: 0,
        totalValorCargo: 0,
        totalValorPatente: 0,
        mediaOcupacao: 0,
        mediaPresencas: 0,
        totalAulas: 0,
        totalPresencas: 0
      });
      return;
    }

    let filtered = [...professorData];
    
    // Aplicar filtro de pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        prof => prof.nome.toLowerCase().includes(query) || 
               prof.cargo.toLowerCase().includes(query) ||
               prof.patente.toLowerCase().includes(query)
      );
    }
    
    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'nome') {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortBy === 'totalAulas') {
        comparison = a.totalAulas - b.totalAulas;
      } else if (sortBy === 'totalPresencas') {
        comparison = a.totalPresencas - b.totalPresencas;
      } else if (sortBy === 'media') {
        comparison = a.media - b.media;
      } else if (sortBy === 'totalGanhos') {
        comparison = a.totalGanhos - b.totalGanhos;
      } else if (sortBy === 'ocupacao') {
        comparison = a.ocupacao - b.ocupacao;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Calcular estatísticas
    // Calcular os valores de cargo e patente
    let valorCargo = 0;
    let valorPatente = 0;
    
    // Iterar pelos professores para obter os valores financeiros
    filtered.forEach(prof => {
      valorCargo += (prof.valorCargo !== undefined ? prof.valorCargo : 0);
      valorPatente += (prof.valorPatente !== undefined ? prof.valorPatente : 0);
    });
    
    // Cálculo para total de aulas e presenças (para referência)
    const totalAulas = filtered.reduce((sum, prof) => sum + (prof.totalAulas || 0), 0);
    const totalPresencas = filtered.reduce((sum, prof) => sum + (prof.totalPresencas || 0), 0);
    
    // Calcular o total de ganhos como a soma de valorCargo e valorPatente
    const totalGanhos = valorCargo + valorPatente;
    
    const stats = {
      totalProfessores: filtered.length,
      totalGanhos: totalGanhos,
      totalValorCargo: valorCargo,
      totalValorPatente: valorPatente,
      mediaOcupacao: filtered.length > 0 
        ? filtered.reduce((sum, prof) => sum + (prof.ocupacao || 0), 0) / filtered.length 
        : 0,
      mediaPresencas: filtered.length > 0 
        ? filtered.reduce((sum, prof) => {
            // Calcula a média de alunos por aula para cada professor e depois a média geral
            return sum + (prof.totalAulas > 0 ? prof.totalPresencas / prof.totalAulas : 0);
          }, 0) / filtered.length
        : 0,
      totalAulas: totalAulas,        // Adicionando o total de aulas
      totalPresencas: totalPresencas // Adicionando o total de presenças
    };
    
    setEstatisticas(stats);
    setFilteredProfessores(filtered);
  }, [professorData, searchQuery, sortBy, sortOrder]);

  // Selecionar um professor para ver detalhes
  const handleSelectProfessor = (id: number) => {
    setSelectedProfessorId(id);
  };

  // Voltar para a lista de professores
  const handleBackToList = () => {
    setSelectedProfessorId(null);
  };

  // Alternar a direção de ordenação
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Gerar PDF de relatório
  const generatePDF = () => {
    if (!detalheProfessor) return;
    
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text(`Relatório de Análise de Professor`, 105, 15, { align: 'center' });
      
      // Informações do professor
      doc.setFontSize(16);
      doc.text(`Professor: ${detalheProfessor.nome}`, 20, 30);
      doc.setFontSize(12);
      doc.text(`Cargo: ${detalheProfessor.cargo}`, 20, 40);
      doc.text(`Patente: ${detalheProfessor.patente}`, 20, 45);
      doc.text(`Período: ${currentMonthYear.label}`, 20, 50);
      
      // Métricas principais
      doc.text(`Total de Aulas: ${detalheProfessor.totalAulas}`, 20, 60);
      doc.text(`Total de Presenças: ${detalheProfessor.totalPresencas}`, 20, 65);
      doc.text(`Média de Alunos por Aula: ${detalheProfessor.mediaAlunos.toFixed(2)}`, 20, 70);
      doc.text(`Taxa de Ocupação: ${detalheProfessor.ocupacao.toFixed(2)}%`, 20, 75);
      doc.text(`Hora Aula: R$ ${detalheProfessor.valorCargo.toFixed(2)}`, 20, 80);
      doc.text(`Meritocracia: R$ ${detalheProfessor.valorPatente.toFixed(2)}`, 20, 85);
      doc.text(`Total de Ganhos: R$ ${detalheProfessor.totalGanhos.toFixed(2)}`, 20, 90);
      
      // Tabela de aulas
      if (detalheProfessor.aulas && detalheProfessor.aulas.length > 0) {
        doc.text('Detalhamento das Aulas:', 20, 95);
        
        // Usando o plugin jspdf-autotable
        autoTable(doc, {
          startY: 100,
          head: [['Data', 'Hora', 'Atividade', 'Alunos', 'Cargo', 'Valor']],
          body: detalheProfessor.aulas.map((aula: Aula) => [
            formatDate(aula.data),
            aula.horaInicio || 'N/D',
            aula.modalidade,
            aula.alunosPresentes,
            aula.cargo || 'N/D',
            `R$ ${aula.valor.toFixed(2)}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [255, 102, 0] }
        });
      }
      
      // Rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(10);
      doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, finalY + 20, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`relatorio-professor-${detalheProfessor.nome.replace(/\s+/g, '-')}.pdf`);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O download do arquivo PDF foi iniciado",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Verificar o tipo de erro para dar uma mensagem mais específica
      let errorMessage = "Não foi possível gerar o PDF. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Renderizar a lista de professores
  const renderProfessoresList = () => {
    if (isLoadingProfessores) {
      return Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 p-4 border dark:border-gray-700 rounded-lg">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ));
    }

    if (professorError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao buscar os dados dos professores. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      );
    }

    if (!filteredProfessores || filteredProfessores.length === 0) {
      return (
        <Alert variant="default" className="my-4">
          <AlertTitle>Nenhum resultado encontrado</AlertTitle>
          <AlertDescription>
            Não foram encontrados professores que correspondam aos critérios de busca.
          </AlertDescription>
        </Alert>
      );
    }

    return filteredProfessores.map(professor => (
      <Card key={professor.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">{professor.nome}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-orange-400 border-orange-400">{professor.cargo}</Badge>
                <Badge variant="outline" className="text-blue-400 border-blue-400">{professor.patente}</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Aulas</p>
                  <p className="text-xl font-bold text-white">{professor.totalAulas}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Presenças</p>
                  <p className="text-xl font-bold text-white">{professor.totalPresencas}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Média</p>
                  <p className="text-xl font-bold text-white">{(professor.media !== undefined && professor.media !== null) ? professor.media.toFixed(1) : '0.0'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Ocupação</span>
                  <span className="text-sm text-gray-300">{(professor.ocupacao !== undefined && professor.ocupacao !== null) ? professor.ocupacao.toFixed(1) : '0.0'}%</span>
                </div>
                <Progress value={professor.ocupacao || 0} className="h-2" />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Ganhos</p>
                  <p className="text-2xl font-bold text-orange-500">
                    R$ {(professor.totalGanhos !== undefined && professor.totalGanhos !== null) 
                          ? professor.totalGanhos.toFixed(2) 
                          : '0.00'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-orange-500 hover:text-orange-400 hover:bg-gray-700"
                  onClick={() => handleSelectProfessor(professor.id)}
                >
                  Detalhes <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Renderizar detalhes do professor
  const renderProfessorDetail = () => {
    if (isLoadingDetalhe) {
      return (
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    if (detalheError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Erro ao carregar detalhes</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao buscar os detalhes do professor. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      );
    }

    if (!detalheProfessor) {
      return (
        <Alert variant="default" className="my-4">
          <AlertTitle>Nenhum detalhe disponível</AlertTitle>
          <AlertDescription>
            Selecione um professor para ver detalhes.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={handleBackToList}
          >
            Voltar para lista
          </Button>
          
          <Button 
            variant="outline" 
            className="text-orange-500 border-orange-500 hover:bg-orange-950 hover:text-orange-400"
            onClick={generatePDF}
          >
            <Download size={16} className="mr-2" /> Exportar PDF
          </Button>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{detalheProfessor.nome}</h2>
              <div className="flex space-x-2 mt-2">
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  {detalheProfessor.cargo}
                </Badge>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {detalheProfessor.patente}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">
                <Calendar size={14} className="inline mr-1" /> 
                Período: {currentMonthYear.label}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Total de Aulas</p>
                  <UserCheck className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mt-2">{detalheProfessor.totalAulas}</h3>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Total de Presenças</p>
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mt-2">{detalheProfessor.totalPresencas}</h3>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Média por Aula</p>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mt-2">{detalheProfessor.mediaAlunos?.toFixed(1) || '0.0'}</h3>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Total Ganhos</p>
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-orange-500 mt-2">
                  R$ {detalheProfessor.totalGanhos?.toFixed(2) || '0.00'}
                </h3>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Hora Aula</p>
                  <Award className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-blue-500 mt-2">
                  R$ {detalheProfessor.valorCargo?.toFixed(2) || '0.00'}
                </h3>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-850 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Meritocracia</p>
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-orange-500 mt-2">
                  R$ {detalheProfessor.valorPatente?.toFixed(2) || '0.00'}
                </h3>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Taxa de Ocupação</h3>
            <div className="bg-gray-750 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full"
                style={{ width: `${Math.min(detalheProfessor.ocupacao || 0, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-400">0%</span>
              <span className="text-sm text-white font-medium">{detalheProfessor.ocupacao?.toFixed(1) || '0.0'}%</span>
              <span className="text-sm text-gray-400">100%</span>
            </div>
          </div>
          
          <Tabs defaultValue="aulas">
            <TabsList className="bg-gray-750 border-gray-700">
              <TabsTrigger value="aulas" className="data-[state=active]:bg-gray-700">Aulas</TabsTrigger>
              <TabsTrigger value="modalidades" className="data-[state=active]:bg-gray-700">Modalidades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="aulas" className="mt-4">
              <h3 className="text-xl font-semibold text-white mb-3">Detalhamento das Aulas</h3>
              
              {detalheProfessor.aulas && detalheProfessor.aulas.length > 0 ? (
                <div className="bg-gray-850 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-750">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Data</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">
                          <div className="flex items-center">
                            <span>Hora</span>
                            <Clock className="ml-1 h-3 w-3" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Atividade</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">
                          <div className="flex items-center">
                            <span>Alunos</span>
                            <Users className="ml-1 h-3 w-3" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Cargo</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">
                          <div className="flex items-center justify-end">
                            <span>Valor</span>
                            <DollarSign className="ml-1 h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalheProfessor.aulas.map((aula: Aula, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-825' : 'bg-gray-850'}>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {formatDate(aula.data)}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-medium">
                            {aula.horaInicio || 'N/D'}
                          </td>
                          <td className="py-3 px-4 text-sm text-white">
                            <Badge 
                              variant="outline" 
                              className="bg-transparent border-orange-500 text-orange-400"
                            >
                              {aula.modalidade}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-medium">
                            {aula.alunosPresentes || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-blue-400">
                            <Badge 
                              variant="outline" 
                              className="bg-transparent border-blue-500 text-blue-400"
                            >
                              {aula.cargo || 'N/D'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-orange-500 font-medium text-right">
                            R$ {aula.valor?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-750">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-sm font-medium text-gray-300">
                          Total
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-white">
                          {detalheProfessor.totalPresencas}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-orange-500 text-right">
                          R$ {detalheProfessor.totalGanhos?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Nenhuma aula encontrada</AlertTitle>
                  <AlertDescription>
                    Não há registro de aulas para este professor no período selecionado.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="modalidades" className="mt-4">
              <h3 className="text-xl font-semibold text-white mb-3">Análise por Modalidade</h3>
              
              {detalheProfessor.modalidades && detalheProfessor.modalidades.length > 0 ? (
                <div className="space-y-4">
                  {detalheProfessor.modalidades.map((modalidade: Modalidade, index: number) => (
                    <Card key={index} className="bg-gray-850 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-lg font-medium text-white">{modalidade.nome}</h4>
                          <Badge variant="outline" className="bg-transparent border-orange-500 text-orange-400">
                            {modalidade.totalAulas} aulas
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400">Média de alunos</p>
                            <p className="text-lg font-semibold text-white">{modalidade.mediaAlunos?.toFixed(1) || '0.0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Ocupação</p>
                            <p className="text-lg font-semibold text-white">{modalidade.ocupacao?.toFixed(1) || '0.0'}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Ganhos</p>
                            <p className="text-lg font-semibold text-orange-500">
                              R$ {modalidade.valorTotal?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-xs text-gray-400 mb-1">Desempenho</div>
                          <Progress 
                            value={modalidade.ocupacao || 0} 
                            className="h-2 bg-gray-700" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Nenhuma modalidade encontrada</AlertTitle>
                  <AlertDescription>
                    Não há registro de modalidades para este professor no período selecionado.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-500">Análise de Professores</h1>
        
        <Select
          value={currentMonth + '/' + currentYear}
          onValueChange={(value) => {
            // O valor vem como 'month/year'
            const [month, year] = value.split('/').map(Number);
            const monthNames = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            setCurrentMonth(month);
            setCurrentYear(year);
            setCurrentMonthLabel(`${monthNames[month - 1]}/${year}`);
          }}
        >
          <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {(() => {
              const options = [];
              const today = new Date();
              const currentMonth = today.getMonth() + 1; // getMonth() retorna 0-11, precisamos 1-12
              const currentYear = today.getFullYear();
              const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ];

              for (let i = 0; i < 12; i++) {
                let month = currentMonth - i;
                let year = currentYear;

                if (month <= 0) {
                  month += 12;
                  year -= 1;
                }

                options.push(
                  <SelectItem key={`${month}/${year}`} value={`${month}/${year}`}>
                    {monthNames[month - 1]} {year}
                  </SelectItem>
                );
              }

              return options;
            })()}
          </SelectContent>
        </Select>
      </div>
      
      {/* Resumo geral de todos os professores */}
      {!selectedProfessorId && filteredProfessores && filteredProfessores.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-orange-500 mb-2">Resumo Geral - {currentMonthYear.label}</h2>
            <p className="text-gray-400 text-sm">Visão consolidada de todos os professores neste período</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Professores</p>
                    <p className="text-3xl font-bold text-white mt-1">{estatisticas.totalProfessores}</p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total Hora Aula</p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                      R$ {estatisticas.totalValorCargo.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded-lg">
                    <Award className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total Meritocracia</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      R$ {estatisticas.totalValorPatente.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Ganhos</p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">
                      R$ {estatisticas.totalGanhos.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha do resumo com métricas de médias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Taxa Média de Ocupação</h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-2xl font-bold text-white">{estatisticas.mediaOcupacao.toFixed(1)}%</p>
                  <BarChart2 className="h-5 w-5 text-blue-400" />
                </div>
                <Progress 
                  value={estatisticas.mediaOcupacao} 
                  className="h-2 bg-gray-700" 
                />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Média de Alunos por Aula</h3>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">{estatisticas.mediaPresencas.toFixed(1)}</p>
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {estatisticas.totalPresencas} presenças / {estatisticas.totalAulas} aulas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Média de Aulas por Professor</h3>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">
                    {filteredProfessores.length > 0 
                      ? (estatisticas.totalAulas / filteredProfessores.length).toFixed(1) 
                      : "0.0"}
                  </p>
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Ganho Médio por Professor</h3>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-orange-500">
                    R$ {filteredProfessores.length > 0 
                      ? (estatisticas.totalGanhos / filteredProfessores.length).toFixed(2) 
                      : "0.00"}
                  </p>
                  <Award className="h-5 w-5 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {!selectedProfessorId ? (
        <>
          <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar professor, cargo ou patente..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-4">
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="totalAulas">Total de Aulas</SelectItem>
                  <SelectItem value="totalPresencas">Total de Presenças</SelectItem>
                  <SelectItem value="media">Média de Alunos</SelectItem>
                  <SelectItem value="totalGanhos">Total de Ganhos</SelectItem>
                  <SelectItem value="ocupacao">Taxa de Ocupação</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-700"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderProfessoresList()}
          </div>
        </>
      ) : (
        renderProfessorDetail()
      )}
    </div>
  );
};

export default AnaliseHorariosPage;