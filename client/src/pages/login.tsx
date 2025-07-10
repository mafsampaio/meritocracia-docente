import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { LoginData, loginSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import mascoteLogo from '@/assets/mascote.png';
import logoImg from '@/assets/logo.png';

const Login: React.FC = () => {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: ''
    }
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      console.log("Tentando login com:", data);
      // Garantir que os campos correspondam ao que o servidor espera
      const loginData = {
        email: data.email.trim(),
        senha: data.senha
      };
      const userData = await login(loginData);
      console.log("Login bem-sucedido, redirecionando...", userData);
      
      // Forçar um pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        // Redirecionar para o dashboard com URL completa para forçar navegação
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error("Erro durante login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 dark:bg-gray-900 px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-6 p-6">
        
        {/* Coluna do formulário com logo centralizado */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <div className="mb-8 flex justify-center">
            <img src={logoImg} alt="CF98 Logo" className="h-50 w-auto" />
          </div>
          
          <Card className="w-full max-w-md bg-gray-800 dark:bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold mb-2 text-white">Sistema de Meritocracia</CardTitle>
              <CardDescription className="text-gray-300">Faça login para acessar sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="seu@email.com" 
                            type="email" 
                            disabled={isLoading}
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field} 
                          />
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
                        <FormLabel className="text-gray-200">Senha</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="********" 
                            type="password" 
                            disabled={isLoading}
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="w-full mt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </div>
                      ) : "Entrar"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-orange-400 hover:text-orange-300"
                        onClick={() => setLocation('/esqueci-senha')}
                      >
                        Esqueci minha senha
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-gray-400">
              Sistema de gestão de meritocracia para professores
            </CardFooter>
          </Card>
        </div>
        
        {/* Coluna do mascote (visível apenas em telas maiores) */}
        <div className="hidden md:flex md:w-1/2 justify-center items-center">
          <img 
            src={mascoteLogo} 
            alt="Mascote CF98" 
            className="h-auto max-h-[500px] w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
