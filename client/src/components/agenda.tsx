import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarPlus, 
  ChevronLeft, 
  ChevronRight,
  Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CriarAulasSérieDialog } from "./criar-aulas-serie-dialog";
import { useAuth } from "@/lib/auth";
import { AgendaCalendario } from "./agenda-calendario";

// Função auxiliar para formatar data
function formatarData(dataString: string) {
  try {
    const data = parseISO(dataString);
    return format(data, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dataString;
  }
}

// Função auxiliar para obter nome do dia da semana
function obterDiaSemana(dataString: string) {
  try {
    const data = parseISO(dataString);
    return format(data, "EEEE", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao obter dia da semana:", error);
    return "";
  }
}

type Aula = {
  id: number;
  data: string;
  horaInicio: string;
  capacidade: number;
  modalidade: string;
  modalidadeId: number;
  professores: Array<{
    id: number;
    nome: string;
    cargo: string;
    patente: string;
  }>;
};

export function Agenda() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [dataAtual, setDataAtual] = useState<Date>(new Date());
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [modalCriarAulasSerie, setModalCriarAulasSerie] = useState(false);

  // Formatação de filtros para a API
  const filtros = useMemo(() => {
    const inicio = new Date(dataAtual);
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Segunda-feira
    
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6); // Domingo
    
    return {
      dataInicio: format(inicio, "yyyy-MM-dd"),
      dataFim: format(fim, "yyyy-MM-dd")
    };
  }, [dataAtual]);

  // Carregar aulas da semana atual
  const { data: aulas = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/aulas", filtros, termoBusca],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("dataInicio", filtros.dataInicio);
      params.append("dataFim", filtros.dataFim);
      if (termoBusca) params.append("busca", termoBusca);

      const res = await fetch(`/api/aulas?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar aulas");
      return res.json();
    },
  });

  // Navegar para a semana anterior
  const semanaAnterior = () => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() - 7);
    setDataAtual(novaData);
  };

  // Navegar para a próxima semana
  const proximaSemana = () => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + 7);
    setDataAtual(novaData);
  };

  // Obter texto do período atual
  const periodoTexto = useMemo(() => {
    const inicio = new Date(dataAtual);
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Segunda-feira
    
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6); // Domingo
    
    return `${format(inicio, "dd/MM", { locale: ptBR })} - ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`;
  }, [dataAtual]);

  return (
    <div className="space-y-2">
      {/* Barra de navegação e busca - tudo em uma linha */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1">
        {/* Busca à esquerda */}
        <div className="relative w-72 order-2 sm:order-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por professor ou modalidade"
            className="pl-8 h-9"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
        
        {/* Data no meio */}
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={semanaAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="font-medium px-2">{periodoTexto}</span>
          
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={proximaSemana}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Botão Criar Aulas à direita */}
        <div className="order-3">
          {isAdmin && (
            <Button onClick={() => setModalCriarAulasSerie(true)} className="h-9">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Criar Aulas em Série
            </Button>
          )}
        </div>
      </div>

      <Card className="mt-1">
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="text-center py-8">Carregando aulas...</div>
          ) : aulas.length === 0 ? (
            <div className="text-center py-8">
              Nenhuma aula encontrada no período selecionado
            </div>
          ) : (
            <AgendaCalendario 
              aulas={aulas} 
              dataInicio={filtros.dataInicio} 
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para criar aulas em série */}
      <CriarAulasSérieDialog
        isOpen={modalCriarAulasSerie}
        onClose={() => setModalCriarAulasSerie(false)}
      />
    </div>
  );
}