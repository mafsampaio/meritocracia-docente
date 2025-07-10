import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';

// Schema para validação
const adminFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "professor"]).default("admin")
});

// Tipo inferido do schema
type AdminFormData = z.infer<typeof adminFormSchema>;

export default function CriarAdmin() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Configuração do formulário
  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      role: "admin"
    }
  });

  const onSubmit = async (data: AdminFormData) => {
    try {
      const response = await apiRequest('POST', '/api/professores', data);
      
      if (response.ok) {
        toast({
          title: "Administrador criado com sucesso!",
          description: "O novo administrador pode fazer login com as credenciais fornecidas.",
          variant: "default"
        });
        navigate('/cadastro');
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar administrador");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar administrador",
        description: error.message || "Ocorreu um erro ao tentar criar o administrador",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout hideSectionHeader>
      <div className="container mx-auto py-10 w-full max-w-md">
        <Card className="border-orange-600 dark:border-orange-400">
          <CardHeader className="space-y-1 bg-orange-600 dark:bg-orange-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center">Criar Novo Administrador</CardTitle>
            <CardDescription className="text-gray-200 text-center">
              Crie um novo usuário com acesso de administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
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
                        <Input type="email" placeholder="seu@email.com" {...field} />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha" {...field} />
                      </FormControl>
                      <FormDescription>
                        Mínimo de 6 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Usuário</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de usuário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                    Criar Administrador
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button variant="link" onClick={() => navigate('/cadastro')}>
              Voltar para Cadastros
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}