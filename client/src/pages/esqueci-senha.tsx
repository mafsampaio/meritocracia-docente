import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { forgotPasswordSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import mascoteLogo from '@/assets/mascote.png';
import logoImg from '@/assets/logo.png';

interface ForgotPasswordData {
  email: string;
}

const EsqueciSenha: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: data.email.trim() })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao processar sua solicitação');
      }
      
      setEmailSent(true);
      toast({
        title: "Solicitação enviada",
        description: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição:", error);
      toast({
        title: "Erro ao processar solicitação",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
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
              <CardTitle className="text-2xl font-bold mb-2 text-white">Recuperação de Senha</CardTitle>
              <CardDescription className="text-gray-300">
                {emailSent 
                  ? "Verifique seu email para instruções" 
                  : "Informe seu email para receber instruções"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="text-center space-y-6">
                  <div className="mx-auto bg-gray-700 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                    <Send size={24} className="text-orange-500" />
                  </div>
                  <p className="text-gray-300">
                    Se o email informado estiver cadastrado em nosso sistema, você receberá em instantes
                    um link para redefinir sua senha.
                  </p>
                  <p className="text-gray-300">
                    Verifique também sua pasta de spam se não encontrar o email na caixa de entrada.
                  </p>
                  <Button 
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => setLocation('/login')}
                  >
                    Voltar para Login
                  </Button>
                </div>
              ) : (
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
                    <div className="w-full mt-6 flex flex-col space-y-3">
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
                            Enviando...
                          </div>
                        ) : "Recuperar Senha"}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => setLocation('/login')}
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Voltar para Login
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
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

export default EsqueciSenha;