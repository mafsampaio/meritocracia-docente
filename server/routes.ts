import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { configureAuth } from "./auth";
import { storage } from "./storage";
import { 
  loginSchema, 
  professorInsertSchema, 
  aulaUpdateSchema, 
  financeiroInsertSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  aulas, 
  aulaProfessores 
} from "@shared/schema";
import { emailService } from "./email";
import { db } from "@db";
import { z } from "zod";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup de autenticação
  configureAuth(app);

  // Rotas para autenticação
  app.post("/api/auth/login", (req, res, next) => {
    try {
      console.log("Recebida requisição de login:", req.body);
      const credentials = loginSchema.parse(req.body);
      console.log("Credenciais validadas:", credentials);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          console.error("Erro na autenticação:", err);
          return next(err);
        }
        if (!user) {
          console.log("Usuário não encontrado ou senha incorreta:", info?.message);
          return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
        }
        
        console.log("Usuário autenticado:", user.email);
        req.login(user, (err) => {
          if (err) {
            console.error("Erro ao fazer login:", err);
            return next(err);
          }
          console.log("Login bem-sucedido para:", user.email);
          return res.json({
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Erro no processamento do login:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    });
  });

  // Middleware para verificar autenticação
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autenticado" });
  };

  // Middleware para verificar se é admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Acesso negado" });
  };

  // Middleware para verificar se é o próprio professor ou admin
  const isOwnProfileOrAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      const professorId = parseInt(req.params.id);
      if (req.user.role === "admin" || req.user.id === professorId) {
        return next();
      }
    }
    res.status(403).json({ message: "Acesso negado" });
  };
  
  // Middleware para meritocracia - professor vê apenas seus dados, admin vê todos
  const isMeritocraciaAccessAllowed = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      const professorId = parseInt(req.params.id);
      if (req.user.role === "admin" || req.user.id === professorId) {
        return next();
      }
    }
    res.status(403).json({ message: "Acesso negado" });
  };

  // Rotas para modalidades
  app.get("/api/modalidades", isAuthenticated, async (req, res) => {
    try {
      const modalidades = await storage.listModalidades();
      res.json(modalidades);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar modalidades" });
    }
  });

  // Rotas para cargos
  app.get("/api/cargos", isAuthenticated, async (req, res) => {
    try {
      const cargos = await storage.listCargos();
      res.json(cargos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cargos" });
    }
  });

  // Rotas para patentes
  app.get("/api/patentes", isAuthenticated, async (req, res) => {
    try {
      const patentes = await storage.listPatentes();
      res.json(patentes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar patentes" });
    }
  });

  // Rotas para professores
  app.get("/api/professores", isAdmin, async (req, res) => {
    try {
      // Usar o novo método que já filtra apenas professores
      const professores = await storage.listProfessores();
      
      // Adicionar campos extras para compatibilidade com interface
      const professoresFormatados = professores.map(p => ({
        id: p.id,
        nome: p.nome,
        email: p.email || "",
        role: p.role,
        totalAulas: 0,
        totalAlunos: 0,
        mediaAlunos: 0,
        valorReceber: 0
      }));
      
      res.json(professoresFormatados);
    } catch (error) {
      console.error("Erro na rota de professores:", error);
      res.status(500).json({ message: "Erro ao buscar professores" });
    }
  });

  app.get("/api/professores/lista", isAuthenticated, async (req, res) => {
    try {
      const professores = await storage.listProfessores();
      // Retornar apenas id e nome
      const lista = professores.map(p => ({ id: p.id, nome: p.nome }));
      res.json(lista);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar lista de professores" });
    }
  });

  app.get("/api/professores/destaques", isAuthenticated, async (req, res) => {
    try {
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const limit = parseInt(req.query.limit as string || "3");
      
      try {
        const professores = await storage.getProfessoresDestaque(mesAno, limit);
        res.json(professores);
      } catch (error) {
        console.error("Erro ao buscar professores em destaque:", error);
        // Se houver erro, retorne um array vazio ou alguns professores básicos
        const professoresBasico = await storage.listProfessores();
        const top3 = professoresBasico
          .slice(0, limit)
          .map(p => ({
            id: p.id,
            nome: p.nome,
            email: p.email,
            totalAulas: 0,
            totalAlunos: 0,
            mediaAlunos: 0,
            valorReceber: 0
          }));
          
        res.json(top3.length > 0 ? top3 : []);
      }
    } catch (error) {
      console.error("Erro na rota de professores em destaque:", error);
      res.status(500).json({ message: "Erro ao buscar professores em destaque" });
    }
  });

  app.get("/api/professores/:id", isOwnProfileOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const professor = await storage.getProfessorById(id, mesAno);
      
      if (!professor) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      res.json(professor);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar professor" });
    }
  });

  app.get("/api/professores/:id/aulas", isOwnProfileOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const aulas = await storage.getProfessorAulas(id, mesAno);
      res.json(aulas);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar aulas do professor" });
    }
  });

  app.post("/api/professores", isAdmin, async (req, res) => {
    try {
      console.log("Dados recebidos:", req.body);
      
      // Criar schema personalizado que não inclui senhaHash
      const professorCustomSchema = z.object({
        nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
        senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
        role: z.enum(["admin", "professor"], {
          required_error: "Papel deve ser 'admin' ou 'professor'",
        }).default("professor")
      });
      
      // Validar dados
      const data = professorCustomSchema.parse(req.body);
      console.log("Dados validados:", data);
      
      // Tratar email vazio como null para evitar conflitos com restrição de unicidade
      const emailToSave = data.email && data.email.trim() !== '' ? data.email : null;
      
      // Verificar se email (quando fornecido) já existe
      if (emailToSave) {
        const existingUser = await storage.getUserByEmail(emailToSave);
        if (existingUser) {
          return res.status(400).json({ message: "Email já cadastrado" });
        }
      }

      // Garantir que tenha uma senha padrão se não for fornecida
      const dataToSave = {
        ...data,
        email: emailToSave,
        senha: data.senha || "senha123" // Senha padrão quando não fornecida
      };
      
      console.log("Dados a salvar:", dataToSave);
      
      // Criar professor
      const [newProfessor] = await storage.createUser(dataToSave);
      
      res.status(201).json({
        id: newProfessor.id,
        nome: newProfessor.nome,
        email: newProfessor.email,
        role: newProfessor.role
      });
    } catch (error) {
      console.error("Erro ao criar professor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao criar professor" });
    }
  });

  // Rotas para aulas
  app.post("/api/aulas", isAdmin, async (req, res) => {
    try {
      // Validar dados
      const schema = z.object({
        modalidadeId: z.number(),
        data: z.date(),
        horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
        capacidade: z.number().positive(),
        professores: z.array(z.object({
          professorId: z.number(),
          cargoId: z.number(),
          patenteId: z.number()
        })).min(1, "Adicione pelo menos um professor")
      });
      
      const data = schema.parse(req.body);
      
      // Criar aula
      const novaAula = await storage.createAula(data);
      
      res.status(201).json(novaAula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao criar aula" });
    }
  });
  
  app.post("/api/aulas-serie", isAdmin, async (req, res) => {
    try {
      // Validar dados
      const schema = z.object({
        modalidadeId: z.number(),
        diasSemana: z.array(z.number().min(0).max(6)),
        horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
        dataInicio: z.string().or(z.date()),
        dataFim: z.string().or(z.date()),
        capacidade: z.number().positive(),
        professores: z.array(z.object({
          professorId: z.number(),
          cargoId: z.number(),
          patenteId: z.number()
        })).min(1, "Adicione pelo menos um professor")
      });
      
      const validatedData = schema.parse(req.body);
      const dataInicio = new Date(validatedData.dataInicio);
      const dataFim = new Date(validatedData.dataFim);
      
      // Criar aulas em série
      try {
        const resultado = await storage.createAulasEmSerie({
          modalidadeId: validatedData.modalidadeId,
          diasSemana: validatedData.diasSemana,
          horaInicio: validatedData.horaInicio,
          dataInicio: dataInicio,
          dataFim: dataFim,
          capacidade: validatedData.capacidade,
          professores: validatedData.professores
        });
        
        // Se chegamos até aqui, pelo menos algumas aulas foram criadas
        if (resultado.totalAulas > 0) {
          // Verificar se tem warning (sucesso parcial)
          if (resultado.warning) {
            return res.status(201).json({
              ...resultado,
              message: `Foram criadas ${resultado.totalAulas} aulas, porém ocorreram alguns erros. Verifique o histórico para mais detalhes.`
            });
          }
          
          return res.status(201).json({
            ...resultado,
            message: `Foram criadas ${resultado.totalAulas} aulas com sucesso.`
          });
        } else {
          // Não conseguimos criar nenhuma aula
          return res.status(400).json({ 
            message: "Não foi possível criar as aulas. Verifique se já não existem aulas cadastradas para as datas/horários selecionados." 
          });
        }
      } catch (createError) {
        console.error("Erro interno ao criar aulas em série:", createError);
        if (createError instanceof Error) {
          return res.status(400).json({ 
            message: `Erro ao criar aulas: ${createError.message}`
          });
        }
        return res.status(500).json({ 
          message: "Erro interno ao processar as aulas. Por favor, tente novamente com menos aulas ou em lotes menores." 
        });
      }
    } catch (error) {
      console.error("Erro de validação ao criar aulas em série:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });

  app.get("/api/aulas/disponiveis-checkin", isAuthenticated, async (req, res) => {
    try {
      const aulas = await storage.getAulasDisponiveisCheckin();
      res.json(aulas);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar aulas disponíveis" });
    }
  });
  
  app.get("/api/aulas/com-presenca", isAuthenticated, async (req, res) => {
    try {
      const { user } = req as any;
      const professorId = parseInt(req.query.professorId as string || user.id.toString());
      const limit = parseInt(req.query.limit as string || "10");
      
      let aulas;
      if (user.role === "admin" && !req.query.professorId) {
        // Admin vê todas as aulas com presença se não especificar um professor
        aulas = await storage.getAulasComPresenca(limit);
      } else {
        // Professor vê apenas suas aulas ou admin vê de um professor específico
        aulas = await storage.getAulasPresencaPorProfessor(professorId, limit);
      }
      
      res.json(aulas);
    } catch (error) {
      console.error("Erro ao buscar aulas com presença:", error);
      res.status(500).json({ message: "Erro ao buscar aulas com presença" });
    }
  });
  
  app.get("/api/aulas", isAuthenticated, async (req, res) => {
    try {
      const modalidadeId = req.query.modalidadeId ? Number(req.query.modalidadeId) : undefined;
      const diaSemana = req.query.diaSemana as string | undefined;
      const dataInicio = req.query.dataInicio as string | undefined;
      const dataFim = req.query.dataFim as string | undefined;
      const busca = req.query.busca as string | undefined;
      
      const aulas = await storage.getAllAulas({
        modalidadeId,
        diaSemana,
        dataInicio,
        dataFim,
        busca
      });
      
      res.json(aulas);
    } catch (error) {
      console.error("Erro ao buscar aulas:", error);
      res.status(500).json({ message: "Erro ao buscar aulas" });
    }
  });

  app.get("/api/aulas/:id/professores", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const professores = await storage.getProfessoresDaAula(id);
      res.json(professores);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar professores da aula" });
    }
  });
  
  // Rota para excluir uma aula
  app.delete("/api/aulas/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se a aula existe
      const aula = await db.query.aulas.findFirst({
        where: eq(aulas.id, id)
      });
      
      if (!aula) {
        return res.status(404).json({ message: "Aula não encontrada" });
      }
      
      // Primeiro, remover todas as relações de professores com esta aula
      await db.delete(aulaProfessores)
        .where(eq(aulaProfessores.aulaId, id));
      
      // Depois, excluir a aula em si
      await db.delete(aulas)
        .where(eq(aulas.id, id));
      
      res.status(200).json({ message: "Aula excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir aula:", error);
      res.status(500).json({ message: "Erro ao excluir aula" });
    }
  });
  
  // Rota para atualizar uma aula (PATCH)
  app.patch("/api/aulas/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validar dados
      const schema = z.object({
        modalidadeId: z.number().optional(),
        capacidade: z.number().positive().optional(),
        horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)").optional(),
        professoresConfig: z.array(z.object({
          professorId: z.number(),
          cargoId: z.number(),
          patenteId: z.number()
        })).optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      // Buscar a aula atual
      const aula = await db.query.aulas.findFirst({
        where: eq(aulas.id, id)
      });
      
      if (!aula) {
        return res.status(404).json({ message: "Aula não encontrada" });
      }
      
      // Atualizar campos básicos da aula
      const updateData: any = {};
      if (validatedData.modalidadeId !== undefined) updateData.modalidadeId = validatedData.modalidadeId;
      if (validatedData.capacidade !== undefined) updateData.capacidade = validatedData.capacidade;
      if (validatedData.horaInicio !== undefined) updateData.horaInicio = validatedData.horaInicio;
      
      // Atualizar a aula no banco de dados
      await db.update(aulas)
        .set(updateData)
        .where(eq(aulas.id, id));
      
      // Se tiver configuração de professores, atualizar relações
      if (validatedData.professoresConfig && validatedData.professoresConfig.length > 0) {
        // Remover relações existentes
        await db.delete(aulaProfessores)
          .where(eq(aulaProfessores.aulaId, id));
        
        // Inserir novas relações com cargos e patentes
        const aulaProfessoresData = validatedData.professoresConfig.map(config => ({
          aulaId: id,
          professorId: config.professorId,
          cargoId: config.cargoId,
          patenteId: config.patenteId
        }));
        
        await db.insert(aulaProfessores)
          .values(aulaProfessoresData);
      }
      
      // Buscar a aula atualizada com os professores
      const aulaAtualizada = await db.query.aulas.findFirst({
        where: eq(aulas.id, id),
        with: {
          modalidade: true,
          aulaProfessores: {
            with: {
              professor: true,
              cargo: true,
              patente: true
            }
          }
        }
      });
      
      res.json(aulaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao atualizar aula" });
    }
  });

  // Rotas para check-in (atualizar alunosPresentes)
  app.post("/api/checkin", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validar dados
      const schema = z.object({
        aulaId: z.number(),
        alunosPresentes: z.number().min(0)
      });
      
      const data = schema.parse(req.body);
      
      // Atualizar aula com o número de alunos presentes
      const aula = await db.query.aulas.findFirst({
        where: eq(aulas.id, data.aulaId)
      });
      
      if (!aula) {
        return res.status(404).json({ message: "Aula não encontrada" });
      }
      
      // Verificar se o número de alunos não excede a capacidade
      if (data.alunosPresentes > aula.capacidade) {
        return res.status(400).json({ 
          message: `O número de alunos (${data.alunosPresentes}) não pode exceder a capacidade da aula (${aula.capacidade})` 
        });
      }
      
      // Atualizar alunosPresentes
      const [aulaAtualizada] = await db
        .update(aulas)
        .set({ alunosPresentes: data.alunosPresentes })
        .where(eq(aulas.id, data.aulaId))
        .returning();
      
      res.status(200).json(aulaAtualizada);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao registrar check-in" });
    }
  });

  // Rotas para dashboard e relatórios
  app.get("/api/dashboard/modulo-financeiro/metrics", isAdmin, async (req, res) => {
    try {
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      
      try {
        const metrics = await storage.getDashboardMetrics(mesAno);
        res.json(metrics);
      } catch (error) {
        console.error("Erro ao buscar métricas financeiras:", error);
        // Retornar dados padrão em caso de erro
        res.json({
          totalAulas: 0,
          ocupacaoMedia: 0,
          receitaTotal: 0,
          resultadoLiquido: 0,
          crescimentoAulas: 0,
          crescimentoOcupacao: 0,
          crescimentoReceita: 0,
          crescimentoResultado: 0
        });
      }
    } catch (error) {
      console.error("Erro na rota de métricas financeiras:", error);
      res.status(500).json({ message: "Erro ao buscar métricas financeiras" });
    }
  });
  
  app.get("/api/dashboard/aulas-lucro-prejuizo", isAuthenticated, async (req, res) => {
    try {
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      
      // Adicionar log para depuração
      console.log("Consultando aulas com lucro/prejuízo para mês/ano:", mesAno);
      
      try {
        const metrics = await storage.getAulasLucroEPrejuizo(mesAno);
        console.log("Métricas de aulas com lucro/prejuízo:", metrics);
        res.json(metrics);
      } catch (error) {
        console.error("Erro ao buscar métricas de aulas com lucro/prejuízo:", error);
        // Retornar dados padrão em caso de erro
        res.json({
          aulasComLucro: 0,
          aulasComPrejuizo: 0,
          totalAulas: 0
        });
      }
    } catch (error) {
      console.error("Erro na rota de análise de lucro/prejuízo:", error);
      res.status(500).json({ message: "Erro ao analisar aulas com lucro/prejuízo" });
    }
  });

  app.get("/api/dashboard/horarios-aulas", isAuthenticated, async (req, res) => {
    try {
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      
      try {
        const grid = await storage.getHorariosAulas(mesAno);
        res.json(grid);
      } catch (error) {
        console.error("Erro ao buscar grade de horários:", error);
        // Retornar dados padrão em caso de erro
        res.json({
          horarios: [],
          diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
          aulas: {}
        });
      }
    } catch (error) {
      console.error("Erro na rota de grade de horários:", error);
      res.status(500).json({ message: "Erro ao buscar grade de horários" });
    }
  });

  app.get("/api/dashboard/detalhes-aula/:id", isAuthenticated, async (req, res) => {
    try {
      const classId = req.params.id;
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const details = await storage.getClassDetail(classId, mesAno);
      res.json(details);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Erro ao buscar detalhes da aula" });
    }
  });
  
  // Rotas para filtros da análise financeira
  app.get("/api/dashboard/filtros/modalidades", isAuthenticated, async (req, res) => {
    try {
      const modalidades = await storage.listModalidades();
      res.json(modalidades);
    } catch (error) {
      console.error('Erro ao listar modalidades:', error);
      res.status(500).json({ message: "Erro ao listar modalidades" });
    }
  });
  
  app.get("/api/dashboard/filtros/professores", isAuthenticated, async (req, res) => {
    try {
      const professores = await storage.listProfessores();
      res.json(professores);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.status(500).json({ message: "Erro ao listar professores" });
    }
  });
  
  // Rotas para gerenciamento de professores
  app.post("/api/professores/editar/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar professor" });
    }
  });
  
  app.delete("/api/professores/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar professor" });
    }
  });
  
  // Rotas para gerenciamento de modalidades
  app.post("/api/modalidades", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const novaModalidade = await storage.criarModalidade(data);
      res.json(novaModalidade[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar modalidade" });
    }
  });
  
  app.post("/api/modalidades/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const modalidadeAtualizada = await storage.atualizarModalidade(id, data);
      res.json(modalidadeAtualizada[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar modalidade" });
    }
  });
  
  app.delete("/api/modalidades/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletarModalidade(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar modalidade" });
    }
  });
  
  // Rotas para gerenciamento de cargos
  app.post("/api/cargos", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const novoCargo = await storage.criarCargo(data);
      res.json(novoCargo[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar cargo" });
    }
  });
  
  app.post("/api/cargos/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const cargoAtualizado = await storage.atualizarCargo(id, data);
      res.json(cargoAtualizado[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar cargo" });
    }
  });
  
  app.delete("/api/cargos/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletarCargo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar cargo" });
    }
  });
  
  // Rotas para gerenciamento de patentes
  app.post("/api/patentes", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const novaPatente = await storage.criarPatente(data);
      res.json(novaPatente[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar patente" });
    }
  });
  
  app.post("/api/patentes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const patenteAtualizada = await storage.atualizarPatente(id, data);
      res.json(patenteAtualizada[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar patente" });
    }
  });
  
  app.delete("/api/patentes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletarPatente(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar patente" });
    }
  });
  
  // Rotas para valores fixos
  app.get("/api/valores-fixos", isAdmin, async (req, res) => {
    try {
      let valores;
      try {
        valores = await storage.getValoresFixos();
      } catch (error) {
        console.error("Erro ao buscar valores fixos:", error);
      }
      // Sempre retornar valores padrão, independentemente se houve erro ou não
      res.json(valores || { receitaPorAluno: "28.00", custoFixoPorAula: "78.00" });
    } catch (error) {
      console.error("Erro em valores fixos:", error);
      // Mesmo em caso de erro, retornar valores padrão
      res.json({ receitaPorAluno: "28.00", custoFixoPorAula: "78.00" });
    }
  });
  
  app.post("/api/valores-fixos", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const valores = await storage.criarOuAtualizarValoresFixos(data);
      res.json(valores[0]);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar valores fixos" });
    }
  });
  
  // Rotas para registros financeiros
  app.get("/api/financeiros", isAuthenticated, async (req, res) => {
    try {
      const aulaId = req.query.aulaId ? Number(req.query.aulaId) : undefined;
      const financeiros = await storage.getFinanceiros(aulaId);
      res.json(financeiros);
    } catch (error) {
      console.error("Erro ao buscar registros financeiros:", error);
      res.status(500).json({ message: "Erro ao buscar registros financeiros" });
    }
  });
  
  app.post("/api/financeiros", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const validatedData = financeiroInsertSchema.parse(data);
      const financeiro = await storage.criarFinanceiro(validatedData);
      res.status(201).json(financeiro);
    } catch (error) {
      console.error("Erro ao criar registro financeiro:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar registro financeiro" });
    }
  });
  
  app.put("/api/financeiros/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const financeiro = await storage.atualizarFinanceiro(id, data);
      res.json(financeiro);
    } catch (error) {
      console.error("Erro ao atualizar registro financeiro:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar registro financeiro" });
    }
  });
  
  app.delete("/api/financeiros/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deletarFinanceiro(id);
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir registro financeiro:", error);
      res.status(500).json({ message: "Erro ao excluir registro financeiro" });
    }
  });
  
  // Rotas para meritocracia
  app.get("/api/meritocracia/professores", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      // Verificar se o usuário é admin, apenas admins podem listar todos os professores
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const professores = await storage.getProfessoresMeritocracia(mesAno);
      res.json(professores);
    } catch (error) {
      console.error("Erro ao buscar dados de meritocracia:", error);
      res.status(500).json({ message: "Erro ao buscar dados de meritocracia" });
    }
  });
  
  app.get("/api/meritocracia/professor/:id", isMeritocraciaAccessAllowed, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const professor = await storage.getProfessorMeritocracia(id, mesAno);
      
      if (!professor) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      res.json(professor);
    } catch (error) {
      console.error("Erro ao buscar dados de meritocracia do professor:", error);
      res.status(500).json({ message: "Erro ao buscar dados de meritocracia do professor" });
    }
  });

  // Rotas para análise de professores
  
  // API para análise de professores (listagem geral)
  app.get("/api/analise-professores", isAdmin, async (req, res) => {
    try {
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      
      const professores = await storage.getProfessoresMeritocracia(mesAno);
      
      // Transformar e enriquecer os dados para a análise, garantindo todos os campos necessários
      const professoresAnalise = professores.map(professor => {
        // Extrair valores de cargo e patente
        const valorCargo = professor.valorCargo || 0;
        const valorPatente = professor.valorPatente || 0;
        
        return {
          id: professor.id,
          nome: professor.nome,
          cargo: professor.cargo || 'Não definido',
          patente: professor.patente || 'Não definida',
          totalAulas: professor.totalAulas || 0,
          totalPresencas: professor.totalPresencas || 0,
          media: professor.mediaAlunos || 0,
          valorCargo: valorCargo, // Incluindo explicitamente o valor do cargo
          valorPatente: valorPatente, // Incluindo explicitamente o valor da patente
          totalGanhos: valorCargo + valorPatente, // Soma do valor do cargo + valor da patente
          ocupacao: professor.ocupacao || 0
        };
      });
      
      res.json(professoresAnalise);
    } catch (error) {
      console.error('Erro ao buscar análise de professores:', error);
      res.status(500).json({ message: 'Erro ao buscar análise de professores' });
    }
  });
  
  // API para análise detalhada de um professor específico
  app.get("/api/analise-professores/detalhe/:id", isAdmin, async (req, res) => {
    try {
      const professorId = parseInt(req.params.id);
      const mesAno = req.query.mesAno as string || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      
      if (isNaN(professorId)) {
        return res.status(400).json({ message: 'ID do professor inválido' });
      }
      
      // Obter os detalhes do professor
      const professor = await storage.getProfessorById(professorId, mesAno);
      
      if (!professor) {
        return res.status(404).json({ message: 'Professor não encontrado' });
      }
      
      // Obter as aulas do professor
      const aulas = await storage.getProfessorAulas(professorId, mesAno);
      
      // Calcular métricas por modalidade
      const modalidades: { [key: string]: any } = {};
      const capacidadePorModalidade: { [key: string]: { alunos: number, capacidade: number } } = {};
      let totalGanhos = 0;
      
      // Primeiro, coletamos dados de capacidade por modalidade
      for (const aula of aulas) {
        if (!capacidadePorModalidade[aula.modalidade]) {
          capacidadePorModalidade[aula.modalidade] = { alunos: 0, capacidade: 0 };
        }
        
        capacidadePorModalidade[aula.modalidade].alunos += Number(aula.quantidadeAlunos || 0);
        capacidadePorModalidade[aula.modalidade].capacidade += Number(aula.capacidade || 0);
      }
      
      // Depois processamos as aulas para calcular estatísticas por modalidade
      for (const aula of aulas) {
        if (!modalidades[aula.modalidade]) {
          modalidades[aula.modalidade] = {
            nome: aula.modalidade,
            totalAulas: 0,
            totalAlunos: 0,
            valorTotal: 0,
            ocupacao: 0
          };
        }
        
        modalidades[aula.modalidade].totalAulas++;
        // Usar quantidadeAlunos em vez de alunosPresentes
        modalidades[aula.modalidade].totalAlunos += Number(aula.quantidadeAlunos || 0);
        // Usar valorTotal em vez de valor
        modalidades[aula.modalidade].valorTotal += Number(aula.valorTotal || 0);
        totalGanhos += Number(aula.valorTotal || 0);
      }
      
      // Calcular média e ocupação para cada modalidade
      for (const key in modalidades) {
        const modalidade = modalidades[key];
        modalidade.mediaAlunos = modalidade.totalAulas > 0 ? 
          modalidade.totalAlunos / modalidade.totalAulas : 0;
        
        // Calcular a ocupação específica para cada modalidade
        const dadosCapacidade = capacidadePorModalidade[key];
        if (dadosCapacidade && dadosCapacidade.capacidade > 0) {
          modalidade.ocupacao = (dadosCapacidade.alunos / dadosCapacidade.capacidade) * 100;
        } else {
          modalidade.ocupacao = 0;
        }
      }
      
      // Preparar o objeto de resposta
      const resposta = {
        id: professor.id,
        nome: professor.nome,
        cargo: professor.cargo || 'Não definido',
        patente: professor.patente || 'Não definida',
        totalAulas: professor.totalAulas,
        totalPresencas: professor.totalPresencas,
        mediaAlunos: professor.totalAulas > 0 ? professor.totalPresencas / professor.totalAulas : 0,
        ocupacao: professor.ocupacao || 0,
        valorCargo: professor.valorCargo || 0, // Valor total do cargo
        valorPatente: professor.valorPatente || 0, // Valor total da patente (meritocracia)
        totalGanhos: (professor.valorCargo || 0) + (professor.valorPatente || 0), // Corrigido: soma do cargo + patente
        aulas: aulas.map(aula => ({
          id: aula.id,
          data: aula.data,
          horaInicio: aula.horaInicio,
          modalidade: aula.modalidade,
          alunosPresentes: aula.quantidadeAlunos || 0,
          valor: aula.valorTotal || 0, // Usar valorTotal que vem da função getProfessorAulas
          cargo: aula.cargo
        })),
        modalidades: Object.values(modalidades)
      };
      
      res.json(resposta);
    } catch (error) {
      console.error('Erro ao buscar detalhes do professor:', error);
      res.status(500).json({ message: 'Erro ao buscar detalhes do professor' });
    }
  });

  // ===== Rotas para recuperação de senha =====

  // Rota para solicitar redefinição de senha
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      console.log("Requisição de recuperação de senha recebida:", req.body);
      const { email } = forgotPasswordSchema.parse(req.body);
      console.log("Email validado:", email);

      // Verificar se o email existe
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("Usuário não encontrado para o email:", email);
        // Por segurança, não informamos ao usuário se o email existe ou não
        return res.status(200).json({ 
          message: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha." 
        });
      }

      console.log("Usuário encontrado:", user.id, user.email, user.nome);

      // Gerar token de redefinição de senha
      console.log("Gerando token para o usuário:", user.id);
      const token = await storage.createPasswordResetToken(user.id);
      console.log("Token gerado:", token.id);

      // Construir URL para redefinição de senha
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token.token}`;
      console.log("URL de redefinição:", resetUrl);

      // Enviar email com link de redefinição
      console.log("Enviando email de redefinição para:", email);
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        user.nome,
        token.token,
        resetUrl
      );

      console.log("Resultado do envio de email:", emailSent);

      if (!emailSent) {
        console.error("Falha ao enviar email de redefinição de senha");
        return res.status(500).json({ 
          message: "Houve um problema ao enviar o email. Por favor, tente novamente mais tarde." 
        });
      }

      // Retornar resposta genérica por segurança
      res.status(200).json({ 
        message: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha." 
      });
    } catch (error) {
      console.error("Erro ao processar solicitação de redefinição de senha:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ 
        message: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente." 
      });
    }
  });

  // Rota para validar token de redefinição de senha
  app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const validation = await storage.validatePasswordResetToken(token);
      
      if (!validation.valid) {
        return res.status(400).json({ 
          valid: false, 
          message: "Link inválido ou expirado. Por favor, solicite um novo link." 
        });
      }
      
      res.status(200).json({ 
        valid: true, 
        message: "Token válido. Você pode redefinir sua senha." 
      });
    } catch (error) {
      console.error("Erro ao validar token de redefinição:", error);
      res.status(500).json({ 
        valid: false, 
        message: "Ocorreu um erro ao validar seu link. Por favor, tente novamente." 
      });
    }
  });

  // Rota para redefinir senha
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      // Extraímos apenas os campos necessários após a validação
      const validatedData = resetPasswordSchema.parse(req.body);
      const { senha, token } = validatedData;
      
      // Validar token
      const validation = await storage.validatePasswordResetToken(token);
      
      if (!validation.valid || !validation.userId || !validation.tokenId) {
        return res.status(400).json({ 
          message: "Link inválido ou expirado. Por favor, solicite um novo link." 
        });
      }
      
      // Redefinir senha
      const success = await storage.resetPassword(validation.userId, senha);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Não foi possível redefinir sua senha. Por favor, tente novamente." 
        });
      }
      
      // Marcar token como usado
      await storage.markTokenAsUsed(validation.tokenId);
      
      res.status(200).json({ 
        message: "Senha redefinida com sucesso. Você já pode fazer login com sua nova senha." 
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ 
        message: "Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
