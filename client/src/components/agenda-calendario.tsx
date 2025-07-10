import { useState, useMemo, useEffect } from "react";
import { format, parseISO, addDays, startOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Edit, Trash2, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

type Professor = {
  id: number;
  nome: string;
  cargo: string;
  patente: string;
};

type Aula = {
  id: number;
  data: string;
  horaInicio: string;
  capacidade: number;
  modalidade: string;
  modalidadeId: number;
  professores: Professor[];
  alunosPresentes?: number; // Quantidade de alunos presentes
};

interface AgendaCalendarioProps {
  aulas: Aula[];
  dataInicio?: string; // Data de início da semana
  onRefresh?: () => void;
}

export function AgendaCalendario({ aulas, dataInicio, onRefresh }: AgendaCalendarioProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [aulaAtiva, setAulaAtiva] = useState<Aula | null>(null);
  const [aulaEditada, setAulaEditada] = useState<Partial<Aula> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [numeroAlunos, setNumeroAlunos] = useState<number>(0);
  const [modalidades, setModalidades] = useState<Array<{id: number, nome: string}>>([]);
  const [professoresDisponiveis, setProfessoresDisponiveis] = useState<Array<{id: number, nome: string}>>([]);
  const [professoresSelecionados, setProfessoresSelecionados] = useState<Array<number>>([]);
  // Estados para cargos e patentes
  const [cargos, setCargos] = useState<Array<{id: number, nome: string}>>([]);
  const [patentes, setPatentes] = useState<Array<{id: number, nome: string}>>([]);
  // Configuração de cargo e patente para cada professor
  const [professoresConfig, setProfessoresConfig] = useState<Array<{
    professorId: number;
    cargoId: number;
    patenteId: number;
  }>>([]);
  
  // Em vez de gerar todos os horários, vamos identificar quais horários têm aulas
  const horarios = useMemo(() => {
    // Conjunto para evitar duplicatas
    const horariosUnicos = new Set<string>();
    
    // Adicionar horários das aulas
    aulas.forEach(aula => {
      horariosUnicos.add(aula.horaInicio);
    });
    
    // Converter para array e ordenar
    return Array.from(horariosUnicos).sort();
  }, [aulas]);
  
  // Determinar a data de início da semana (se não fornecida, usa a data atual)
  const dataInicioSemana = useMemo(() => {
    const hoje = dataInicio ? parseISO(dataInicio) : new Date();
    return startOfWeek(hoje, { weekStartsOn: 1 }); // Inicia a semana na segunda-feira
  }, [dataInicio]);
  
  // Gerar os dias da semana, incluindo domingo
  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const data = addDays(dataInicioSemana, i);
      return {
        data,
        diaSemana: format(data, "EEE", { locale: ptBR }).replace("-feira", ""), // Versão mais abreviada do dia
        diaFormatado: format(data, "dd/MM", { locale: ptBR }),
      };
    });
  }, [dataInicioSemana]);

  // Organizar as aulas por dia e horário
  const aulasPorDiaHorario = useMemo(() => {
    const resultado: Record<string, Record<string, Aula[]>> = {};
    
    // Inicializar estrutura vazia
    diasSemana.forEach(dia => {
      const dataFormatada = format(dia.data, "yyyy-MM-dd");
      resultado[dataFormatada] = {};
      
      horarios.forEach(horario => {
        resultado[dataFormatada][horario] = [];
      });
    });
    
    // Preencher com as aulas
    aulas.forEach(aula => {
      try {
        const dataAula = parseISO(aula.data);
        const dataFormatada = format(dataAula, "yyyy-MM-dd");
        
        // Verificar se a data está dentro da semana sendo exibida
        if (isWithinInterval(dataAula, { 
          start: dataInicioSemana, 
          end: addDays(dataInicioSemana, 6) 
        })) {
          // Se o horário já existe, adiciona a aula, senão inicializa com a aula
          const horarioAula = aula.horaInicio;
          if (!resultado[dataFormatada][horarioAula]) {
            resultado[dataFormatada][horarioAula] = [];
          }
          resultado[dataFormatada][horarioAula].push(aula);
        }
      } catch (error) {
        console.error("Erro ao processar aula:", error, aula);
      }
    });
    
    return resultado;
  }, [aulas, diasSemana, dataInicioSemana, horarios]);
  
  // Efeito para carregar modalidades
  useEffect(() => {
    async function carregarModalidades() {
      try {
        const response = await fetch('/api/modalidades');
        if (response.ok) {
          const data = await response.json();
          setModalidades(data);
        }
      } catch (error) {
        console.error('Erro ao carregar modalidades:', error);
      }
    }
    
    carregarModalidades();
  }, []);
  
  // Efeito para carregar professores
  useEffect(() => {
    async function carregarProfessores() {
      try {
        const response = await fetch('/api/professores/lista');
        if (response.ok) {
          const data = await response.json();
          setProfessoresDisponiveis(data);
        }
      } catch (error) {
        console.error('Erro ao carregar professores:', error);
      }
    }
    
    carregarProfessores();
  }, []);
  
  // Efeito para carregar cargos
  useEffect(() => {
    async function carregarCargos() {
      try {
        const response = await fetch('/api/cargos');
        if (response.ok) {
          const data = await response.json();
          setCargos(data);
        }
      } catch (error) {
        console.error('Erro ao carregar cargos:', error);
      }
    }
    
    carregarCargos();
  }, []);
  
  // Efeito para carregar patentes
  useEffect(() => {
    async function carregarPatentes() {
      try {
        const response = await fetch('/api/patentes');
        if (response.ok) {
          const data = await response.json();
          setPatentes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar patentes:', error);
      }
    }
    
    carregarPatentes();
  }, []);
  
  const abrirAula = (aula: Aula) => {
    setAulaAtiva(aula);
    // Inicializar os dados de edição com os valores atuais da aula
    setAulaEditada({
      modalidadeId: aula.modalidadeId,
      capacidade: aula.capacidade,
      horaInicio: aula.horaInicio,
    });
    // Definir os professores selecionados
    setProfessoresSelecionados(aula.professores.map(prof => prof.id));
    
    // Inicializar a configuração de cargos e patentes para os professores
    const configInicial = aula.professores.map(prof => {
      // Encontrar o ID do cargo pelo nome
      const cargoId = cargos.find(cargo => cargo.nome === prof.cargo)?.id || 0;
      // Encontrar o ID da patente pelo nome
      const patenteId = patentes.find(patente => patente.nome === prof.patente)?.id || 0;
      
      return {
        professorId: prof.id,
        cargoId,
        patenteId
      };
    });
    
    setProfessoresConfig(configInicial);
    setIsDialogOpen(true);
  };
  
  const abrirCheckIn = (aula: Aula) => {
    // Se não for admin, apenas visualizar os detalhes da aula
    if (!isAdmin) {
      setAulaAtiva(aula);
      // Ver detalhes apenas
      return;
    }
    
    setAulaAtiva(aula);
    setNumeroAlunos(aula.alunosPresentes || 0);
    setIsCheckInDialogOpen(true);
  };
  
  const abrirConfirmacaoExclusao = (aula: Aula) => {
    setAulaAtiva(aula);
    setIsDeleteDialogOpen(true);
  };
  
  // Atualizar o valor editado da aula
  const atualizarValorAula = (campo: string, valor: any) => {
    if (!aulaEditada) return;
    setAulaEditada({
      ...aulaEditada,
      [campo]: valor
    });
  };
  
  // Alternar a seleção de um professor
  const toggleProfessorSelecionado = (professorId: number) => {
    if (professoresSelecionados.includes(professorId)) {
      setProfessoresSelecionados(professoresSelecionados.filter(id => id !== professorId));
      // Remover configuração do professor quando desmarcado
      setProfessoresConfig(professoresConfig.filter(p => p.professorId !== professorId));
    } else {
      setProfessoresSelecionados([...professoresSelecionados, professorId]);
      // Adicionar configuração padrão para o professor quando marcado
      // Usar primeiro cargo e patente disponíveis, ou IDs 0 como fallback
      const cargoId = cargos.length > 0 ? cargos[0].id : 0;
      const patenteId = patentes.length > 0 ? patentes[0].id : 0;
      setProfessoresConfig([...professoresConfig, { professorId, cargoId, patenteId }]);
    }
  };
  
  // Atualizar a configuração de cargo e patente de um professor
  const atualizarProfessorConfig = (professorId: number, campo: 'cargoId' | 'patenteId', valor: number) => {
    const index = professoresConfig.findIndex(p => p.professorId === professorId);
    if (index === -1) return; // Professor não encontrado
    
    const novaConfig = [...professoresConfig];
    novaConfig[index] = {
      ...novaConfig[index],
      [campo]: valor
    };
    
    setProfessoresConfig(novaConfig);
  };
  
  const salvarEdicao = async () => {
    if (!aulaAtiva || !aulaEditada) return;
    
    try {
      // Verificar se todos os professores selecionados têm configuração
      const professorSemConfig = professoresSelecionados.find(
        id => !professoresConfig.some(p => p.professorId === id)
      );
      
      if (professorSemConfig) {
        toast({
          title: "Configuração incompleta",
          description: "Todos os professores devem ter cargo e patente definidos",
          variant: "destructive",
        });
        return;
      }
      
      // Filtrar apenas as configurações dos professores selecionados
      const configsParaEnviar = professoresConfig.filter(
        config => professoresSelecionados.includes(config.professorId)
      );
      
      const response = await fetch(`/api/aulas/${aulaAtiva.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...aulaEditada,
          professoresConfig: configsParaEnviar
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar aula');
      }
      
      toast({
        title: "Aula atualizada",
        description: "As informações da aula foram atualizadas com sucesso",
      });
      
      setIsDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a aula",
        variant: "destructive",
      });
    }
  };
  
  const salvarCheckIn = async () => {
    if (!aulaAtiva) return;
    
    try {
      // Verificar se o número de alunos é maior que a capacidade
      if (numeroAlunos > aulaAtiva.capacidade) {
        toast({
          title: "Erro",
          description: `Número de alunos não pode ser maior que a capacidade (${aulaAtiva.capacidade})`,
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: aulaAtiva.id,
          alunosPresentes: numeroAlunos,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao registrar check-in');
      }
      
      toast({
        title: "Check-in registrado",
        description: `${numeroAlunos} alunos registrados na aula de ${aulaAtiva.modalidade}`,
      });
      
      setIsCheckInDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar o check-in",
        variant: "destructive",
      });
    }
  };
  
  const excluirAula = async () => {
    if (!aulaAtiva) return;
    
    try {
      const response = await fetch(`/api/aulas/${aulaAtiva.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir aula');
      }
      
      toast({
        title: "Aula excluída",
        description: "A aula foi excluída com sucesso",
      });
      
      setIsDeleteDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a aula",
        variant: "destructive",
      });
    }
  };

  // Renderizar a célula do calendário com aulas
  const renderCelula = (dia: string, horario: string) => {
    const aulasNaCelula = aulasPorDiaHorario[dia]?.[horario] || [];
    
    if (aulasNaCelula.length === 0) {
      return <div className="h-full min-h-[60px]"></div>;
    }
    
    return (
      <div className="space-y-2 p-1 h-full">
        {aulasNaCelula.map(aula => (
          <div 
            key={aula.id} 
            className="bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded p-2 text-[10px] cursor-pointer min-h-[100px] overflow-hidden"
            onClick={() => abrirCheckIn(aula)}
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-xs break-words mr-2">{aula.modalidade}</div>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      abrirAula(aula);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirConfirmacaoExclusao(aula);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="text-muted-foreground mt-1 overflow-hidden">
              {aula.professores.map((prof, index) => (
                <div key={prof.id} className="text-[10px] break-words leading-tight mb-1">
                  <span className="font-bold">{prof.patente}</span>{" "}
                  <span className="break-words">{prof.nome}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end items-center mt-2">
              <div className="text-sm font-bold">
                {aula.alunosPresentes || 0}/{aula.capacidade}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="overflow-hidden w-full">
        {/* Cabeçalho fixo com dias da semana */}
        <div className="sticky top-0 z-10 w-full">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-background border-b">
            <div className="p-2 font-medium border-r border-border"></div>
            {diasSemana.map((dia, index) => (
              <div 
                key={index} 
                className="p-2 text-center font-medium border-r border-border"
              >
                <div className="capitalize text-primary">{dia.diaSemana}</div>
                <div className="text-xs text-muted-foreground">{dia.diaFormatado}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Área de rolagem com o conteúdo das aulas */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="w-full">
            {/* Corpo do calendário */}
            <div>
              {horarios.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma aula agendada neste período
                </div>
              ) : (
                horarios.map((horario, hIndex) => (
                  <div 
                    key={hIndex} 
                    className="grid grid-cols-[60px_repeat(7,1fr)] hover:bg-muted/40"
                  >
                    {/* Horário à esquerda */}
                    <div className="p-2 font-medium text-sm border-b border-r border-border">
                      {horario}
                    </div>
                    
                    {/* Células dos dias */}
                    {diasSemana.map((dia, dIndex) => {
                      const dataFormatada = format(dia.data, "yyyy-MM-dd");
                      return (
                        <div 
                          key={dIndex} 
                          className="border-b border-r border-border min-h-[60px] overflow-hidden"
                        >
                          {renderCelula(dataFormatada, horario)}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </Card>
      
      {/* Modal de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
          </DialogHeader>
          {aulaAtiva && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Badge>{aulaAtiva.modalidade}</Badge>
                <Badge variant="outline" className="ml-2">
                  {format(parseISO(aulaAtiva.data), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {aulaAtiva.horaInicio}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <Label>Modalidade</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={aulaEditada?.modalidadeId || aulaAtiva.modalidadeId}
                  onChange={(e) => atualizarValorAula('modalidadeId', Number(e.target.value))}
                >
                  {modalidades.map(modalidade => (
                    <option key={modalidade.id} value={modalidade.id}>
                      {modalidade.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <Label>Capacidade</Label>
                <Input 
                  type="number" 
                  value={aulaEditada?.capacidade || aulaAtiva.capacidade}
                  onChange={(e) => {
                    const valor = Number(e.target.value);
                    if (!isNaN(valor) && valor > 0) {
                      atualizarValorAula('capacidade', valor);
                    }
                  }}
                  min={1}
                />
              </div>
              
              <div className="space-y-1">
                <Label>Hora de Início</Label>
                <Input 
                  type="time" 
                  value={aulaEditada?.horaInicio || aulaAtiva.horaInicio}
                  onChange={(e) => atualizarValorAula('horaInicio', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="block mb-2">Professores</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/20">
                  {professoresDisponiveis.map(prof => {
                    const selecionado = professoresSelecionados.includes(prof.id);
                    const config = professoresConfig.find(p => p.professorId === prof.id);
                    
                    return (
                      <div key={prof.id} className="space-y-2">
                        <div 
                          className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-muted/40 ${selecionado ? 'bg-primary/20 border border-primary/30' : ''}`}
                          onClick={() => toggleProfessorSelecionado(prof.id)}
                        >
                          <span className="font-medium">{prof.nome}</span>
                          <div className="h-4 w-4 rounded-sm border flex items-center justify-center">
                            {selecionado && <span className="text-primary">✓</span>}
                          </div>
                        </div>
                        
                        {/* Exibir seletores de cargo e patente quando professor selecionado */}
                        {selecionado && config && (
                          <div className="ml-4 p-2 border border-border rounded bg-muted/10 space-y-2">
                            <div className="flex gap-2 items-center">
                              <Label className="text-xs w-14">Cargo:</Label>
                              <select 
                                className="flex h-7 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={config.cargoId}
                                onChange={(e) => atualizarProfessorConfig(prof.id, 'cargoId', Number(e.target.value))}
                              >
                                {cargos.map(cargo => (
                                  <option key={cargo.id} value={cargo.id}>
                                    {cargo.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex gap-2 items-center">
                              <Label className="text-xs w-14">Patente:</Label>
                              <select 
                                className="flex h-7 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={config.patenteId}
                                onChange={(e) => atualizarProfessorConfig(prof.id, 'patenteId', Number(e.target.value))}
                              >
                                {patentes.map(patente => (
                                  <option key={patente.id} value={patente.id}>
                                    {patente.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={salvarEdicao}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Check-in */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Check-in</DialogTitle>
          </DialogHeader>
          {aulaAtiva && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="font-medium text-lg">{aulaAtiva.modalidade}</div>
                <div className="text-muted-foreground">
                  {format(parseISO(aulaAtiva.data), "dd/MM/yyyy", { locale: ptBR })} - {aulaAtiva.horaInicio}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numeroAlunos">Número de Alunos Presentes</Label>
                <Input 
                  id="numeroAlunos"
                  type="number" 
                  value={numeroAlunos}
                  onChange={(e) => {
                    const valor = Number(e.target.value);
                    if (!isNaN(valor) && valor >= 0 && valor <= aulaAtiva.capacidade) {
                      setNumeroAlunos(valor);
                    }
                  }}
                  max={aulaAtiva.capacidade}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: {aulaAtiva.capacidade} alunos
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={salvarCheckIn}>Registrar Check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Aula</DialogTitle>
          </DialogHeader>
          {aulaAtiva && (
            <div className="py-4">
              <p>Tem certeza que deseja excluir a aula de <strong>{aulaAtiva.modalidade}</strong> do dia {format(parseISO(aulaAtiva.data), "dd/MM/yyyy", { locale: ptBR })} às {aulaAtiva.horaInicio}?</p>
              <p className="mt-2 text-muted-foreground">Esta ação não pode ser desfeita.</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={excluirAula}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}