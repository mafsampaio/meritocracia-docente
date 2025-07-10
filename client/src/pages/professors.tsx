import React, { useState, useEffect } from 'react';
import { generateMonthYearOptions } from '@/app-context';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface Professor {
  id: number;
  nome: string;
  email: string;
  totalAulas: number;
  totalAlunos: number;
  mediaAlunos: number;
  valorReceber: number;
}

const createProfessorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")), // Email é opcional
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "professor"], {
    required_error: "Selecione um papel",
  }),
});

type CreateProfessorFormValues = z.infer<typeof createProfessorSchema>;

const Professors: React.FC = () => {
  const monthYearOptions = generateMonthYearOptions();
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Estado local para substituir o useAppContext
  const today = new Date();
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
    label: `${monthYearOptions[0].label}`
  });
  
  // Efeito para atualizar o label quando mês/ano mudar
  useEffect(() => {
    const option = monthYearOptions.find(
      opt => opt.month === currentMonthYear.month && opt.year === currentMonthYear.year
    );
    if (option && option.label !== currentMonthYear.label) {
      setCurrentMonthYear(prev => ({ ...prev, label: option.label }));
    }
  }, [currentMonthYear.month, currentMonthYear.year, monthYearOptions]);

  const form = useForm<CreateProfessorFormValues>({
    resolver: zodResolver(createProfessorSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      role: 'professor',
    },
  });

  const { data: professors, isLoading } = useQuery<Professor[]>({
    queryKey: [`/api/professores?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`],
  });

  const filteredProfessors = professors?.filter(
    (prof) => prof.nome.toLowerCase().includes(search.toLowerCase()) || 
              prof.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProfessor = async (values: CreateProfessorFormValues) => {
    try {
      await apiRequest('POST', '/api/professores', values);
      
      toast({
        title: "Professor adicionado",
        description: "Professor foi cadastrado com sucesso!",
      });

      // Limpar form e fechar diálogo
      form.reset();
      setIsAddDialogOpen(false);
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: [`/api/professores?mesAno=${currentMonthYear.month + 1}/${currentMonthYear.year}`] });
    } catch (error) {
      toast({
        title: "Erro ao adicionar professor",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar o professor.",
        variant: "destructive",
      });
    }
  };

  // Função para gerar uma cor de fundo com base no ID do professor
  const getAvatarColor = (id: number) => {
    const colors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning'];
    return colors[id % colors.length];
  };

  return (
    <>
      <header className="bg-card shadow-sm dark:border-b dark:border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
            <h2 className="text-xl font-semibold text-primary">Professores</h2>
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

      <div className="space-y-6">
        <div className="bg-card rounded-lg shadow dark:bg-card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar professores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Professor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] dark:bg-card dark:border-border">
                <DialogHeader>
                  <DialogTitle className="text-primary">Adicionar Professor</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    Preencha os dados abaixo para cadastrar um novo professor no sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddProfessor)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} className="dark:bg-card dark:border-border dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} className="dark:bg-card dark:border-border dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} className="dark:bg-card dark:border-border dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Papel</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="dark:bg-card dark:border-border dark:text-white">
                                <SelectValue placeholder="Selecione um papel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="select-content">
                              <SelectItem value="professor" className="select-item">Professor</SelectItem>
                              <SelectItem value="admin" className="select-item">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="mt-6">
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">Salvar</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="rounded-full h-10 w-10 bg-muted"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProfessors && filteredProfessors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="teacher-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary font-bold">Professor</TableHead>
                      <TableHead className="text-primary font-bold">Total de Aulas</TableHead>
                      <TableHead className="text-primary font-bold">Total de Alunos</TableHead>
                      <TableHead className="text-primary font-bold">Média de Alunos</TableHead>
                      <TableHead className="text-primary font-bold">Valor a Receber</TableHead>
                      <TableHead className="text-primary font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessors.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell className="dark:text-white">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(professor.id)} text-white flex items-center justify-center font-bold`}>
                              <span>{professor.nome.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium dark:text-white">{professor.nome}</div>
                              <div className="text-sm text-muted-foreground dark:text-gray-400">{professor.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-white">{professor.totalAulas}</TableCell>
                        <TableCell className="dark:text-white">{professor.totalAlunos}</TableCell>
                        <TableCell className="dark:text-white">{professor.mediaAlunos}</TableCell>
                        <TableCell className="dark:text-green-400 text-green-600 font-medium">
                          R$ {Number(professor.valorReceber).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </TableCell>
                        <TableCell>
                          <Link href={`/professor/${professor.id}`} className="text-primary hover:text-primary/80 mr-3">
                            Detalhes
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Nenhum professor encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Professors;
