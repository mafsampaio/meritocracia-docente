import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces para os dados
interface Aula {
  id: number;
  data: string;
  horaInicio: string;
  modalidade: string;
  capacidade: number;
}

// Schema para validação do formulário
const checkinSchema = z.object({
  aulaId: z.coerce.number({
    required_error: "Selecione uma aula",
    invalid_type_error: "Aula inválida"
  }),
  alunosPresentes: z.coerce.number({
    required_error: "Informe a quantidade de alunos"
  }).nonnegative("Quantidade não pode ser negativa").max(100, "Valor muito alto")
});

type CheckinFormValues = z.infer<typeof checkinSchema>;

const Checkin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedAulaId, setSelectedAulaId] = useState<number | null>(null);

  // Buscar aulas disponíveis para hoje
  const { data: aulas, isLoading: aulasLoading } = useQuery<Aula[]>({
    queryKey: ['/api/aulas/disponiveis-checkin'],
  });
  
  // Buscar professores da aula selecionada
  const { data: professoresDaAula, isLoading: professoresLoading } = useQuery<{id: number, nome: string}[]>({
    queryKey: [`/api/aulas/${selectedAulaId}/professores`],
    enabled: !!selectedAulaId,
  });

  // Configurar o formulário
  const form = useForm<CheckinFormValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      aulaId: undefined,
      alunosPresentes: undefined
    }
  });

  // Lidar com mudanças na aula selecionada
  const handleAulaChange = (aulaId: string) => {
    const id = parseInt(aulaId);
    setSelectedAulaId(id);
    form.setValue('aulaId', id);
  };

  // Enviar o formulário
  const onSubmit = async (values: CheckinFormValues) => {
    try {
      await apiRequest('POST', '/api/checkin', values);
      
      toast({
        title: "Check-in realizado",
        description: "Check-in registrado com sucesso!",
      });
      
      form.reset({
        aulaId: undefined,
        alunosPresentes: undefined
      });
      setSelectedAulaId(null);
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/aulas/disponiveis-checkin'] });
      if (selectedAulaId) {
        queryClient.invalidateQueries({ queryKey: [`/api/aulas/${selectedAulaId}/professores`] });
      }
    } catch (error) {
      toast({
        title: "Erro ao realizar check-in",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar o check-in.",
        variant: "destructive",
      });
    }
  };

  // Formatar a data para exibição
  const formatarDataAula = (aula: Aula) => {
    const data = new Date(aula.data);
    return `${format(data, "dd/MM/yyyy", { locale: ptBR })} às ${aula.horaInicio} - ${aula.modalidade}`;
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Realizar Check-in</h2>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Novo Check-in</CardTitle>
            <CardDescription>
              Registre a quantidade de alunos presentes na aula. Apenas o número total é registrado, sem informações pessoais dos alunos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Aula */}
                  <FormField
                    control={form.control}
                    name="aulaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aula</FormLabel>
                        <Select 
                          onValueChange={handleAulaChange} 
                          value={field.value?.toString() || ''}
                          disabled={aulasLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma aula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {aulas?.map((aula) => (
                              <SelectItem key={aula.id} value={aula.id.toString()}>
                                {formatarDataAula(aula)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantidade de Alunos */}
                  <FormField
                    control={form.control}
                    name="alunosPresentes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Alunos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Número de alunos presentes"
                            min={0}
                            max={100}
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
                
                <CardFooter className="px-0 flex justify-end">
                  <Button type="submit">Registrar Check-in</Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Lista de check-ins recentes */}
        <RecentCheckins />
      </div>
    </>
  );
};

// Componente para exibir check-ins recentes
const RecentCheckins: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // Buscar aulas com registro de presença recente
  const { data: aulas, isLoading } = useQuery<{
    id: number;
    data: string;
    horaInicio: string;
    modalidade: string;
    professor: string;
    alunosPresentes: number;
    createdAt: string;
  }[]>({
    queryKey: ['/api/aulas/com-presenca', user?.id],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>Check-ins Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow">
      <CardHeader>
        <CardTitle>Check-ins Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {aulas && aulas.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Data</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Modalidade</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Horário</th>
                {isAdmin && (
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Professor</th>
                )}
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Alunos</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Registrado em</th>
              </tr>
            </thead>
            <tbody>
              {aulas.map((aula) => (
                <tr key={aula.id} className="border-t border-gray-200">
                  <td className="py-3 text-sm">{format(new Date(aula.data), "dd/MM/yyyy", { locale: ptBR })}</td>
                  <td className="py-3 text-sm">{aula.modalidade}</td>
                  <td className="py-3 text-sm">{aula.horaInicio}</td>
                  {isAdmin && (
                    <td className="py-3 text-sm">{aula.professor}</td>
                  )}
                  <td className="py-3 text-sm">{aula.alunosPresentes}</td>
                  <td className="py-3 text-sm">{format(new Date(aula.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-gray-500">
            Nenhum check-in recente encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Checkin;
