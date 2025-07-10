import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import logoImg from '@/assets/logo.png';

// Interface para uso com react-hook-form
interface ResetPasswordData {
  senha: string;
  confirmarSenha: string;
}

// Esquema de validação para redefinir senha
const resetPasswordSchema = z.object({
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
  token: z.string().optional() // Não é usado no formulário, mas precisamos no envio
}).refine(data => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const ResetPassword: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      senha: '',
      confirmarSenha: ''
    }
  });

  useEffect(() => {
    // Extrair token da URL
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = queryParams.get('token');
    
    if (!tokenFromUrl) {
      setErrorMessage('Link inválido. O token de redefinição não foi fornecido.');
      setIsLoading(false);
      return;
    }
    
    setToken(tokenFromUrl);
    
    // Validar o token
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token/${tokenFromUrl}`);
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setErrorMessage(data.message || 'Token inválido ou expirado.');
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setErrorMessage('Ocorreu um erro ao validar o token. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, []);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senha: data.senha,
          confirmarSenha: data.confirmarSenha,
          token
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao redefinir a senha');
      }
      
      setIsSuccess(true);
      
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi redefinida com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="text-gray-300">Verificando link de redefinição...</p>
        </div>
      );
    }
    
    if (errorMessage) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-400 text-center">{errorMessage}</p>
          <Button 
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => navigate('/esqueci-senha')}
          >
            Solicitar um novo link
          </Button>
        </div>
      );
    }
    
    if (isSuccess) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-gray-300 text-center">Sua senha foi redefinida com sucesso!</p>
          <Button 
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => navigate('/login')}
          >
            Ir para Login
          </Button>
        </div>
      );
    }
    
    if (tokenValid) {
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Nova Senha</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="********" 
                      type="password" 
                      disabled={isSubmitting}
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
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="********" 
                      type="password" 
                      disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redefinindo...
                  </div>
                ) : "Redefinir Senha"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar para Login
              </Button>
            </div>
          </form>
        </Form>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md flex flex-col items-center justify-center p-6">
        <div className="mb-8 flex justify-center">
          <img src={logoImg} alt="CF98 Logo" className="h-50 w-auto" />
        </div>
        
        <Card className="w-full bg-gray-800 dark:bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2 text-white">Redefinir Senha</CardTitle>
            <CardDescription className="text-gray-300">
              {isSuccess 
                ? "Senha redefinida com sucesso"
                : tokenValid 
                ? "Crie uma nova senha para sua conta" 
                : "Verificando link de redefinição"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-400">
            Sistema de gestão de meritocracia para professores
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;