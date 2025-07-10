import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { AlertCircle, Edit, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";

const professorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")), // Email é opcional agora
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")), // Senha também é opcional
  role: z.string().default("professor")
});

const modalidadeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres")
});

const cargoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  valorHoraAula: z.coerce.number().positive("Valor deve ser positivo")
});

const patenteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  multiplicadorPorAluno: z.coerce.number().positive("Multiplicador deve ser positivo")
});

const valoresFixosSchema = z.object({
  receitaPorAluno: z.coerce.number().positive("Valor deve ser positivo"),
  custoFixoPorAula: z.coerce.number().positive("Valor deve ser positivo")
});

export default function Cadastro() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Cadastro e Configurações</h1>
      
      <Tabs defaultValue="professores" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="modalidades">Modalidades</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="patentes">Patentes</TabsTrigger>
          <TabsTrigger value="valores">Valores Fixos</TabsTrigger>
        </TabsList>
        
        {/* Professores */}
        <TabsContent value="professores">
          <ProfessoresTab />
        </TabsContent>
        
        {/* Modalidades */}
        <TabsContent value="modalidades">
          <ModalidadesTab />
        </TabsContent>
        
        {/* Cargos */}
        <TabsContent value="cargos">
          <CargosTab />
        </TabsContent>
        
        {/* Patentes */}
        <TabsContent value="patentes">
          <PatentesTab />
        </TabsContent>
        
        {/* Valores Fixos */}
        <TabsContent value="valores">
          <ValoresFixosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tab de Professores
function ProfessoresTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [_, navigate] = useLocation();
  
  const form = useForm<z.infer<typeof professorSchema>>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      role: "professor"
    }
  });
  
  const { data: professores = [], isLoading, error } = useQuery({
    queryKey: ['/api/professores'],
  });
  
  useEffect(() => {
    if (selectedProfessor) {
      form.reset({
        nome: selectedProfessor.nome,
        email: selectedProfessor.email,
        senha: "",  // Não exibimos a senha por segurança
        role: selectedProfessor.role || "professor"
      });
    } else {
      form.reset({
        nome: "",
        email: "",
        senha: "",
        role: "professor"
      });
    }
  }, [selectedProfessor, form]);
  
  const onSubmit = async (data: z.infer<typeof professorSchema>) => {
    try {
      if (selectedProfessor) {
        // Se a senha estiver vazia, não a envia (mantém a atual)
        const updateData = {...data};
        if (!updateData.senha) {
          delete updateData.senha;
        }
        
        // Atualizar professor
        await apiRequest('POST', `/api/professores/editar/${selectedProfessor.id}`, updateData);
        toast({
          title: "Professor atualizado",
          description: `${data.nome} foi atualizado com sucesso.`
        });
      } else {
        // Criar novo professor
        await apiRequest('POST', '/api/professores', data);
        toast({
          title: "Professor criado",
          description: `${data.nome} foi adicionado com sucesso.`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/professores'] });
      setIsOpen(false);
      setSelectedProfessor(null);
    } catch (error) {
      console.error("Erro ao salvar professor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o professor. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;
    
    try {
      await apiRequest('DELETE', `/api/professores/${id}`);
      
      toast({
        title: "Professor excluído",
        description: "Professor foi removido com sucesso."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professores'] });
    } catch (error) {
      console.error("Erro ao excluir professor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o professor. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao carregar os professores. Por favor, tente novamente.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Professores</CardTitle>
        <CardDescription>
          Gerenciamento de professores do sistema. Adicione, edite ou remova professores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button 
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-950 dark:hover:text-orange-300"
            onClick={() => navigate('/criar-admin')}
          >
            Criar Administrador
          </Button>
          <Button 
            onClick={() => {
              setSelectedProfessor(null);
              setIsOpen(true);
            }}
          >
            Adicionar Professor
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.map((professor: any) => (
              <TableRow key={professor.id}>
                <TableCell>{professor.nome}</TableCell>
                <TableCell>{professor.email}</TableCell>
                <TableCell>{professor.role === "admin" ? "Administrador" : "Professor"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedProfessor(professor);
                      setIsOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(professor.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedProfessor ? "Editar Professor" : "Adicionar Professor"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {selectedProfessor ? "editar" : "adicionar"} um professor.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                      <FormLabel>{selectedProfessor ? "Nova Senha (deixe em branco para manter)" : "Senha"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Tab de Modalidades
function ModalidadesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModalidade, setSelectedModalidade] = useState<any>(null);
  
  const form = useForm<z.infer<typeof modalidadeSchema>>({
    resolver: zodResolver(modalidadeSchema),
    defaultValues: {
      nome: ""
    }
  });
  
  const { data: modalidades = [], isLoading, error } = useQuery({
    queryKey: ['/api/modalidades'],
  });
  
  useEffect(() => {
    if (selectedModalidade) {
      form.reset({
        nome: selectedModalidade.nome
      });
    } else {
      form.reset({
        nome: ""
      });
    }
  }, [selectedModalidade, form]);
  
  const onSubmit = async (data: z.infer<typeof modalidadeSchema>) => {
    try {
      if (selectedModalidade) {
        // Atualizar modalidade
        await apiRequest('POST', `/api/modalidades/${selectedModalidade.id}`, data);
        toast({
          title: "Modalidade atualizada",
          description: `${data.nome} foi atualizada com sucesso.`
        });
      } else {
        // Criar nova modalidade
        await apiRequest('POST', '/api/modalidades', data);
        toast({
          title: "Modalidade criada",
          description: `${data.nome} foi adicionada com sucesso.`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/modalidades'] });
      setIsOpen(false);
      setSelectedModalidade(null);
    } catch (error) {
      console.error("Erro ao salvar modalidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a modalidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta modalidade?")) return;
    
    try {
      await apiRequest('DELETE', `/api/modalidades/${id}`);
      
      toast({
        title: "Modalidade excluída",
        description: "Modalidade foi removida com sucesso."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/modalidades'] });
    } catch (error) {
      console.error("Erro ao excluir modalidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a modalidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao carregar as modalidades. Por favor, tente novamente.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modalidades</CardTitle>
        <CardDescription>
          Gerenciamento de modalidades de aula. Adicione, edite ou remova modalidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => {
              setSelectedModalidade(null);
              setIsOpen(true);
            }}
          >
            Adicionar Modalidade
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modalidades.map((modalidade: any) => (
              <TableRow key={modalidade.id}>
                <TableCell>{modalidade.nome}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedModalidade(modalidade);
                      setIsOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(modalidade.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedModalidade ? "Editar Modalidade" : "Adicionar Modalidade"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {selectedModalidade ? "editar" : "adicionar"} uma modalidade.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Tab de Cargos
function CargosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<any>(null);
  
  const form = useForm<z.infer<typeof cargoSchema>>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      nome: "",
      valorHoraAula: 0
    }
  });
  
  const { data: cargos = [], isLoading, error } = useQuery({
    queryKey: ['/api/cargos'],
  });
  
  useEffect(() => {
    if (selectedCargo) {
      form.reset({
        nome: selectedCargo.nome,
        valorHoraAula: Number(selectedCargo.valorHoraAula) || 0
      });
    } else {
      form.reset({
        nome: "",
        valorHoraAula: 0
      });
    }
  }, [selectedCargo, form]);
  
  const onSubmit = async (data: z.infer<typeof cargoSchema>) => {
    try {
      if (selectedCargo) {
        // Atualizar cargo
        await apiRequest('POST', `/api/cargos/${selectedCargo.id}`, data);
        toast({
          title: "Cargo atualizado",
          description: `${data.nome} foi atualizado com sucesso.`
        });
      } else {
        // Criar novo cargo
        await apiRequest('POST', '/api/cargos', data);
        toast({
          title: "Cargo criado",
          description: `${data.nome} foi adicionado com sucesso.`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/cargos'] });
      setIsOpen(false);
      setSelectedCargo(null);
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cargo. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cargo?")) return;
    
    try {
      await apiRequest('DELETE', `/api/cargos/${id}`);
      
      toast({
        title: "Cargo excluído",
        description: "Cargo foi removido com sucesso."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cargos'] });
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cargo. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao carregar os cargos. Por favor, tente novamente.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargos</CardTitle>
        <CardDescription>
          Gerenciamento de cargos de professores. Adicione, edite ou remova cargos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => {
              setSelectedCargo(null);
              setIsOpen(true);
            }}
          >
            Adicionar Cargo
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor Hora/Aula</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos.map((cargo: any) => (
              <TableRow key={cargo.id}>
                <TableCell>{cargo.nome}</TableCell>
                <TableCell>R$ {typeof cargo.valorHoraAula === 'number' 
                  ? cargo.valorHoraAula.toFixed(2) 
                  : Number(cargo.valorHoraAula).toFixed(2)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedCargo(cargo);
                      setIsOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(cargo.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCargo ? "Editar Cargo" : "Adicionar Cargo"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {selectedCargo ? "editar" : "adicionar"} um cargo.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="valorHoraAula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Hora/Aula (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Tab de Patentes
function PatentesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatente, setSelectedPatente] = useState<any>(null);
  
  const form = useForm<z.infer<typeof patenteSchema>>({
    resolver: zodResolver(patenteSchema),
    defaultValues: {
      nome: "",
      multiplicadorPorAluno: 0
    }
  });
  
  const { data: patentes = [], isLoading, error } = useQuery({
    queryKey: ['/api/patentes'],
  });
  
  useEffect(() => {
    if (selectedPatente) {
      form.reset({
        nome: selectedPatente.nome,
        multiplicadorPorAluno: Number(selectedPatente.multiplicadorPorAluno) || 0
      });
    } else {
      form.reset({
        nome: "",
        multiplicadorPorAluno: 0
      });
    }
  }, [selectedPatente, form]);
  
  const onSubmit = async (data: z.infer<typeof patenteSchema>) => {
    try {
      if (selectedPatente) {
        // Atualizar patente
        await apiRequest('POST', `/api/patentes/${selectedPatente.id}`, data);
        toast({
          title: "Patente atualizada",
          description: `${data.nome} foi atualizada com sucesso.`
        });
      } else {
        // Criar nova patente
        await apiRequest('POST', '/api/patentes', data);
        toast({
          title: "Patente criada",
          description: `${data.nome} foi adicionada com sucesso.`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/patentes'] });
      setIsOpen(false);
      setSelectedPatente(null);
    } catch (error) {
      console.error("Erro ao salvar patente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a patente. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta patente?")) return;
    
    try {
      await apiRequest('DELETE', `/api/patentes/${id}`);
      
      toast({
        title: "Patente excluída",
        description: "Patente foi removida com sucesso."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/patentes'] });
    } catch (error) {
      console.error("Erro ao excluir patente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a patente. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao carregar as patentes. Por favor, tente novamente.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patentes</CardTitle>
        <CardDescription>
          Gerenciamento de patentes de professores. Adicione, edite ou remova patentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => {
              setSelectedPatente(null);
              setIsOpen(true);
            }}
          >
            Adicionar Patente
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Multiplicador por Aluno</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patentes.map((patente: any) => (
              <TableRow key={patente.id}>
                <TableCell>{patente.nome}</TableCell>
                <TableCell>R$ {typeof patente.multiplicadorPorAluno === 'number' 
                  ? patente.multiplicadorPorAluno.toFixed(2) 
                  : Number(patente.multiplicadorPorAluno).toFixed(2)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedPatente(patente);
                      setIsOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(patente.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPatente ? "Editar Patente" : "Adicionar Patente"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {selectedPatente ? "editar" : "adicionar"} uma patente.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="multiplicadorPorAluno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplicador por Aluno (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? "0" : e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Tab de Valores Fixos
function ValoresFixosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<z.infer<typeof valoresFixosSchema>>({
    resolver: zodResolver(valoresFixosSchema),
    defaultValues: {
      receitaPorAluno: 28,
      custoFixoPorAula: 78
    }
  });
  
  const { data: valores, isLoading, error } = useQuery({
    queryKey: ['/api/valores-fixos'],
  });
  
  useEffect(() => {
    if (valores) {
      form.reset({
        receitaPorAluno: Number(valores.receitaPorAluno) || 28,
        custoFixoPorAula: Number(valores.custoFixoPorAula) || 78
      });
    }
  }, [valores, form]);
  
  const onSubmit = async (data: z.infer<typeof valoresFixosSchema>) => {
    try {
      await apiRequest('POST', '/api/valores-fixos', data);
      
      toast({
        title: "Valores atualizados",
        description: "Os valores fixos foram atualizados com sucesso."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/valores-fixos'] });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar valores fixos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os valores fixos. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao carregar os valores fixos. Por favor, tente novamente.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores Fixos</CardTitle>
        <CardDescription>
          Configure os valores fixos utilizados nos cálculos financeiros do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Receita por Aluno</h3>
                <p className="text-2xl font-bold">
                  R$ {typeof valores?.receitaPorAluno === 'number' 
                    ? valores.receitaPorAluno.toFixed(2) 
                    : Number(valores?.receitaPorAluno || 28).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Valor recebido por cada aluno presente na aula
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Custo Fixo por Aula</h3>
                <p className="text-2xl font-bold">
                  R$ {typeof valores?.custoFixoPorAula === 'number' 
                    ? valores.custoFixoPorAula.toFixed(2) 
                    : Number(valores?.custoFixoPorAula || 78).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Custo fixo aplicado a cada aula
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>
                Editar Valores
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="receitaPorAluno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receita por Aluno (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value === "" ? "0" : e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="custoFixoPorAula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Fixo por Aula (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value === "" ? "0" : e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}