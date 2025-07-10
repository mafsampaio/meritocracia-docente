import { useState, useEffect } from 'react';
import { apiRequest } from './queryClient';
import { useQuery } from '@tanstack/react-query';
import { LoginData } from '@shared/schema';

interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      console.log("Atualizando estado do usuário com:", data);
      setUser(data);
      setLoading(false);
    }
  }, [data, isLoading]);

  const login = async (loginData: LoginData) => {
    try {
      console.log('Tentando login com:', loginData);
      // Garantir que os nomes dos campos estejam corretos conforme esperado pelo servidor
      const loginPayload = {
        email: loginData.email,
        senha: loginData.senha 
      };
      const response = await apiRequest('POST', '/api/auth/login', loginPayload);
      console.log('Resposta do servidor:', response.status);
      const userData = await response.json();
      console.log('Dados do usuário:', userData);
      
      // Atualiza o estado do usuário e força recarregar os dados de autenticação
      setUser(userData);
      await refetch();
      return userData;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      
      // Redirecionar para a página de login após o logout
      console.log("Logout realizado com sucesso, redirecionando para login");
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const refreshAuth = () => {
    refetch();
  };

  return {
    user,
    loading,
    login,
    logout,
    refreshAuth,
    isAdmin: user?.role === 'admin',
    isProfessor: user?.role === 'professor',
  };
}

// Duplicado do queryClient para evitar referência circular
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => () => Promise<T | null> =
  ({ on401: unauthorizedBehavior }) =>
  async () => {
    const res = await fetch('/api/auth/me', {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  };
