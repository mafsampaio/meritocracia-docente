import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, TrashIcon, PlusIcon } from 'lucide-react';

// Interfaces para os dados do formulário
interface Modalidade {
  id: number;
  nome: string;
}

interface Professor {
  id: number;
  nome: string;
}

interface Cargo {
  id: number;
  nome: string;
  valorHoraAula: number;
}

interface Patente {
  id: number;
  nome: string;
  multiplicadorPorAluno: number;
}

// Schema de validação do formulário
const scheduleSchema = z.object({
  modalidadeId: z.coerce.number({
    required_error: "Selecione uma modalidade",
    invalid_type_error: "Modalidade inválida",
  }),
  data: z.date({
    required_error: "Selecione uma data",
    invalid_type_error: "Data inválida",
  }),
  horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  capacidade: z.coerce.number().positive("Capacidade deve ser positiva"),
  professores: z.array(
    z.object({
      professorId: z.coerce.number({
        required_error: "Selecione um professor",
        invalid_type_error: "Professor inválido",
      }),
      cargoId: z.coerce.number({
        required_error: "Selecione um cargo",
        invalid_type_error: "Cargo inválido",
      }),
      patenteId: z.coerce.number({
        required_error: "Selecione uma patente",
        invalid_type_error: "Patente inválida",
      }),
    })
  ).min(1, "Adicione pelo menos um professor"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const ScheduleClass: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Fetch modalidades, professores, cargos e patentes
  const { data: modalidades } = useQuery<Modalidade[]>({
    queryKey: ['/api/modalidades'],
  });

  const { data: professores } = useQuery<Professor[]>({
    queryKey: ['/api/professores/lista'],
  });

  const { data: cargos } = useQuery<Cargo[]>({
    queryKey: ['/api/cargos'],
  });

  const { data: patentes } = useQuery<Patente[]>({
    queryKey: ['/api/patentes'],
  });

  // Setup form
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      modalidadeId: undefined,
      data: undefined,
      horaInicio: '',
      capacidade: undefined,
      professores: [{ professorId: undefined, cargoId: undefined, patenteId: undefined }],
    },
  });

  // Setup field array para professores
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "professores",
  });

  // Lidar com a adição de professor
  const handleAddProfessor = () => {
    append({ professorId: undefined, cargoId: undefined, patenteId: undefined });
  };

  // Submit do formulário
  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      await apiRequest('POST', '/api/aulas', values);
      
      toast({
        title: "Aula agendada",
        description: "Aula foi agendada com sucesso!",
      });
      
      form.reset();
      setDate(undefined);
      
      // Revalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['/api/aulas'] });
    } catch (error) {
      toast({
        title: "Erro ao agendar aula",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao agendar a aula.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Agendar Aula</h2>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Nova Aula</CardTitle>
            <CardDescription>Preencha os dados para agendar uma nova aula</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Modalidade */}
                  <FormField
                    control={form.control}
                    name="modalidadeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidade</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString() || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma modalidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modalidades?.map((modalidade) => (
                              <SelectItem key={modalidade.id} value={modalidade.id.toString()}>
                                {modalidade.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data */}
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setDate(date);
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hora de Início */}
                  <FormField
                    control={form.control}
                    name="horaInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Início</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Ex: 08:00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Capacidade */}
                  <FormField
                    control={form.control}
                    name="capacidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Número máximo de alunos"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Professores */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Professores</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddProfessor}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar Professor
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Professor</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Patente</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`professores.${index}.professorId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    value={field.value?.toString() || ''}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {professores?.map((professor) => (
                                        <SelectItem key={professor.id} value={professor.id.toString()}>
                                          {professor.nome}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`professores.${index}.cargoId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    value={field.value?.toString() || ''}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {cargos?.map((cargo) => (
                                        <SelectItem key={cargo.id} value={cargo.id.toString()}>
                                          {cargo.nome} (R$ {Number(cargo.valorHoraAula).toFixed(2)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`professores.${index}.patenteId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    value={field.value?.toString() || ''}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {patentes?.map((patente) => (
                                        <SelectItem key={patente.id} value={patente.id.toString()}>
                                          {patente.nome} (R$ {Number(patente.multiplicadorPorAluno).toFixed(2)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {form.formState.errors.professores?.root && (
                    <p className="text-sm text-red-500 mt-2">{form.formState.errors.professores.root.message}</p>
                  )}
                </div>
                
                <CardFooter className="px-0 flex justify-end">
                  <Button type="submit">Agendar Aula</Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ScheduleClass;
