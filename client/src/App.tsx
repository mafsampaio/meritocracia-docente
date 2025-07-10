import React, { useEffect } from "react";
import { Switch, Route, useLocation, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Professors from "@/pages/professors";
import ScheduleClass from "@/pages/schedule-class";
import FinancialReport from "@/pages/financial-report";
import Checkin from "@/pages/checkin";
import Cadastro from "@/pages/cadastro";
import Agenda from "@/pages/agenda";
import Analise from "@/pages/analise";
import AnaliseProfessores from "@/pages/analise-professores";
import ProfessorDetail from "@/pages/professor";
import Meritocracia from "./pages/meritocracia";
import CriarAdmin from "./pages/criar-admin";
import EsqueciSenha from "./pages/esqueci-senha";
import ResetPassword from "./pages/reset-password";
import { useAuth } from "./lib/auth";
import Layout from "./components/layout";

const ProtectedRoute = ({ 
  component: Component, 
  adminOnly = false, 
  ...rest 
}: { 
  component: React.FC<any>, 
  adminOnly?: boolean, 
  [key: string]: any 
}) => {
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      console.log("ProtectedRoute - Estado usuário:", { user, isAdmin, adminOnly });
      if (!user) {
        console.log("Redirecionando para login porque usuário não está autenticado");
        setLocation("/login");
      } else if (adminOnly && !isAdmin) {
        console.log("Redirecionando para dashboard porque usuário não é admin");
        setLocation("/dashboard");
      }
    }
  }, [user, isAdmin, loading, setLocation, adminOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
};

const AuthRoute = ({ component: Component, ...rest }: { component: React.FC<any>, [key: string]: any }) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <Component {...rest} />;
};

function App() {
  return (
    <>
      <Switch>
        <Route path="/login" component={(props) => <AuthRoute component={Login} {...props} />} />
        <Route path="/auth" component={(props) => <AuthRoute component={Login} {...props} />} />
        <Route path="/esqueci-senha" component={EsqueciSenha} />
        <Route path="/reset-password" component={ResetPassword} />
        
        <Route path="/" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
        
        <Route path="/dashboard" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
        
        <Route path="/professores" component={(props) => <ProtectedRoute component={Professors} {...props} />} />
        
        <Route path="/agendar-aula" component={(props) => <ProtectedRoute component={ScheduleClass} {...props} />} />
        
        <Route path="/relatorio-financeiro" component={(props) => <ProtectedRoute component={FinancialReport} {...props} />} />
        
        <Route path="/checkin" component={(props) => <ProtectedRoute component={Checkin} {...props} />} />
        
        <Route path="/professor/:id" 
          component={(props) => <ProtectedRoute component={ProfessorDetail} id={props.params.id} {...props} />} 
        />
        
        <Route path="/cadastro" 
          component={(props) => <ProtectedRoute component={Cadastro} adminOnly={true} {...props} />} 
        />
        
        <Route path="/agenda" 
          component={(props) => <ProtectedRoute component={Agenda} {...props} />} 
        />

        <Route path="/analise" 
          component={(props) => <ProtectedRoute component={Analise} adminOnly={true} {...props} />} 
        />
        
        <Route path="/analise-professores" 
          component={(props) => <ProtectedRoute component={AnaliseProfessores} adminOnly={true} {...props} />} 
        />

        <Route path="/meritocracia" 
          component={(props) => <ProtectedRoute component={Meritocracia} adminOnly={false} {...props} />} 
        />

        <Route path="/criar-admin" 
          component={(props) => <ProtectedRoute component={CriarAdmin} adminOnly={true} {...props} />} 
        />

        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
