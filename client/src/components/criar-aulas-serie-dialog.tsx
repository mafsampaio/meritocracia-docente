import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  CustomSelect as Select,
  CustomSelectContent as SelectContent,
  CustomSelectItem as SelectItem,
  CustomSelectTrigger as SelectTrigger,
  CustomSelectValue as SelectValue,
} from "@/components/ui/custom-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const diasSemanaLabels = [
  { valor: 0, label: "Domingo" },
  { valor: 1, label: "Segunda" },
  { valor: 2, label: "Terça" },
  { valor: 3, label: "Quarta" },
  { valor: 4, label: "Quinta" },
  { valor: 5, label: "Sexta" },
  { valor: 6, label: "Sábado" },
];

const aulasSérieSchema = z.object({
  modalidadeId: z.number({
    required_error: "Selecione uma modalidade",
  }),
  dataInicio: z.date({
    required_error: "Selecione a data de início",
  }),
  dataFim: z.date({
    required_error: "Selecione a data de término",
  }).refine(
    (date) => date instanceof Date && !isNaN(date.getTime()),
    "Data inválida"
  ),
  horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  capacidade: z.coerce.number().positive({
    message: "Capacidade deve ser maior que zero",
  }),
  professores: z.array(
    z.object({
      professorId: z.number(),
      cargoId: z.number(),
      patenteId: z.number(),
    })
  ).min(1, "Adicione pelo menos um professor"),
});

type AulasSérieFormValues = z.infer<typeof aulasSérieSchema>;

interface CriarAulasSérieDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CriarAulasSérieDialog({
  isOpen,
  onClose,
}: CriarAulasSérieDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [professorSelecionado, setProfessorSelecionado] = useState<{
    professorId?: number;
    cargoId?: number;
    patenteId?: number;
  }>({});

  const form = useForm<AulasSérieFormValues>({
    resolver: zodResolver(aulasSérieSchema),
    defaultValues: {
      modalidadeId: undefined,
      dataInicio: undefined,
      dataFim: undefined,
      horaInicio: "",
      capacidade: 10,
      professores: [],
    },
  });

  const adicionarProfessor = () => {
    if (
      !professorSelecionado.professorId ||
      !professorSelecionado.cargoId ||
      !professorSelecionado.patenteId
    ) {
      toast({
        title: "Erro",
        description: "Selecione professor, cargo e patente",
        variant: "destructive",
      });
      return;
    }

    const professorExistente = form.getValues().professores.find(
      (p) => p.professorId === professorSelecionado.professorId
    );

    if (professorExistente) {
      toast({
        title: "Erro",
        description: "Este professor já foi adicionado",
        variant: "destructive",
      });
      return;
    }

    const novoProfessor = {
      professorId: professorSelecionado.professorId,
      cargoId: professorSelecionado.cargoId,
      patenteId: professorSelecionado.patenteId,
    };

    const professoresAtuais = form.getValues().professores;
    form.setValue("professores", [...professoresAtuais, novoProfessor]);
    
    // Resetar seleção de professor
    setProfessorSelecionado({});
  };

  const removerProfessor = (professorId: number) => {
    const professoresAtuais = form.getValues().professores;
    form.setValue(
      "professores",
      professoresAtuais.filter((p) => p.professorId !== professorId)
    );
  };

  const toggleDiaSemana = (dia: number) => {
    setDiasSemana((prev) => {
      if (prev.includes(dia)) {
        return prev.filter((d) => d !== dia);
      } else {
        return [...prev, dia];
      }
    });
  };

  const { data: modalidades = [] } = useQuery({
    queryKey: ["/api/modalidades"],
    queryFn: async () => {
      const res = await fetch("/api/modalidades");
      if (!res.ok) throw new Error("Erro ao carregar modalidades");
      return res.json();
    },
  });

  const { data: professores = [] } = useQuery({
    queryKey: ["/api/professores/lista"],
    queryFn: async () => {
      const res = await fetch("/api/professores/lista");
      if (!res.ok) throw new Error("Erro ao carregar professores");
      return res.json();
    },
  });

  const { data: cargos = [] } = useQuery({
    queryKey: ["/api/cargos"],
    queryFn: async () => {
      const res = await fetch("/api/cargos");
      if (!res.ok) throw new Error("Erro ao carregar cargos");
      return res.json();
    },
  });

  const { data: patentes = [] } = useQuery({
    queryKey: ["/api/patentes"],
    queryFn: async () => {
      const res = await fetch("/api/patentes");
      if (!res.ok) throw new Error("Erro ao carregar patentes");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AulasSérieFormValues & { diasSemana: number[] }) => {
      const res = await apiRequest("POST", "/api/aulas-serie", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Aulas criadas com sucesso",
        description: "As aulas foram adicionadas ao calendário",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/aulas"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao criar aulas:", error);
      toast({
        title: "Erro ao criar aulas",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setDiasSemana([]);
    setProfessorSelecionado({});
  };

  const onSubmit = (values: AulasSérieFormValues) => {
    if (diasSemana.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia da semana",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({ ...values, diasSemana });
  };

  // Professores já selecionados para mostrar
  const professoresSelecionados = form
    .getValues()
    .professores.map((professor) => {
      const prof = professores.find((p) => p.id === professor.professorId);
      const cargo = cargos.find((c) => c.id === professor.cargoId);
      const patente = patentes.find((p) => p.id === professor.patenteId);

      return {
        ...professor,
        nome: prof?.nome || "Professor",
        cargo: cargo?.nome || "Cargo",
        patente: patente?.nome || "Patente",
      };
    });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Criar Aulas em Série</DialogTitle>
          <DialogDescription>
            Crie várias aulas recorrentes em um período específico
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Datas de início e fim na parte superior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data de início</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Término</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data de término</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dias da semana logo abaixo das datas */}
            <div className="space-y-2">
              <FormLabel>Dias da Semana</FormLabel>
              <div className="flex flex-wrap gap-2">
                {diasSemanaLabels.map((dia) => (
                  <Toggle
                    key={dia.valor}
                    pressed={diasSemana.includes(dia.valor)}
                    onPressedChange={() => toggleDiaSemana(dia.valor)}
                    variant="outline"
                    className={
                      diasSemana.includes(dia.valor)
                        ? "bg-[#fff0e6] text-[#ff6600] border-[#ff6600] hover:bg-[#ffe0cc] hover:text-[#ff6600] dark:bg-[#331400] dark:text-[#ff6600] dark:border-[#ff6600] dark:hover:bg-[#662900]"
                        : ""
                    }
                  >
                    {dia.label}
                  </Toggle>
                ))}
              </div>
              {diasSemana.length === 0 && (
                <p className="text-sm text-destructive">
                  Selecione pelo menos um dia da semana
                </p>
              )}
            </div>

            {/* Restante dos campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modalidadeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma modalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modalidades.map((modalidade) => (
                          <SelectItem
                            key={modalidade.id}
                            value={modalidade.id.toString()}
                          >
                            {modalidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="HH:MM"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? "0" : e.target.value;
                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>Professores</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={professorSelecionado.professorId?.toString() || ""}
                  onValueChange={(value) =>
                    setProfessorSelecionado({
                      ...professorSelecionado,
                      professorId: Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((professor) => (
                      <SelectItem
                        key={professor.id}
                        value={professor.id.toString()}
                      >
                        {professor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={professorSelecionado.cargoId?.toString() || ""}
                  onValueChange={(value) =>
                    setProfessorSelecionado({
                      ...professorSelecionado,
                      cargoId: Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map((cargo) => (
                      <SelectItem
                        key={cargo.id}
                        value={cargo.id.toString()}
                      >
                        {cargo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={professorSelecionado.patenteId?.toString() || ""}
                  onValueChange={(value) =>
                    setProfessorSelecionado({
                      ...professorSelecionado,
                      patenteId: Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma patente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patentes.map((patente) => (
                      <SelectItem
                        key={patente.id}
                        value={patente.id.toString()}
                      >
                        {patente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={adicionarProfessor}
              >
                Adicionar Professor
              </Button>

              {/* Lista de professores selecionados */}
              {professoresSelecionados.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Professores Selecionados:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {professoresSelecionados.map((professor) => (
                      <div
                        key={professor.professorId}
                        className="flex items-center justify-between bg-muted p-2 rounded-md"
                      >
                        <div>
                          <span className="font-medium">{professor.nome}</span>
                          <span className="mx-2">•</span>
                          <span>{professor.cargo}</span>
                          <span className="mx-2">•</span>
                          <span>{professor.patente}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerProfessor(professor.professorId)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Criando..." : "Criar Aulas"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}