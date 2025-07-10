import { db } from "./index";
import * as schema from "@shared/schema";
import { hashSync } from "bcrypt";
import { sql, eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Iniciando a população do banco de dados...");

    // Verificar se já existem dados
    const adminResult = await db.select({ count: sql`count(*)` })
      .from(schema.professores)
      .where(eq(schema.professores.role, 'admin'));
    
    const adminCount = parseInt(adminResult[0]?.count as string) || 0;

    if (adminCount > 0) {
      console.log("Dados já existem no banco. Pulando o processo de seed inicial.");
      return;
    }

    // Inserir Cargos
    const cargosPredefinidos = [
      { nome: "Professor", valorHoraAula: 120.00 },
      { nome: "Estagiário", valorHoraAula: 78.00 },
      { nome: "Instrutor", valorHoraAula: 95.00 },
      { nome: "Coordenador", valorHoraAula: 150.00 }
    ];

    const cargosInseridos = await Promise.all(
      cargosPredefinidos.map(async (cargo) => {
        const [inserido] = await db.insert(schema.cargos).values(cargo).returning();
        return inserido;
      })
    );
    console.log(`${cargosInseridos.length} cargos inseridos.`);

    // Inserir Patentes
    const patentesPredefinidas = [
      { nome: "Major", multiplicadorPorAluno: 3.50 },
      { nome: "Capitão", multiplicadorPorAluno: 2.50 },
      { nome: "Tenente", multiplicadorPorAluno: 2.00 },
      { nome: "Sargento", multiplicadorPorAluno: 1.50 }
    ];

    const patentesInseridas = await Promise.all(
      patentesPredefinidas.map(async (patente) => {
        const [inserida] = await db.insert(schema.patentes).values(patente).returning();
        return inserida;
      })
    );
    console.log(`${patentesInseridas.length} patentes inseridas.`);

    // Inserir Modalidades
    const modalidadesPredefinidas = [
      { nome: "Pilates" },
      { nome: "Yoga" },
      { nome: "Funcional" },
      { nome: "Boxe" },
      { nome: "Dança" }
    ];

    const modalidadesInseridas = await Promise.all(
      modalidadesPredefinidas.map(async (modalidade) => {
        const [inserida] = await db.insert(schema.modalidades).values(modalidade).returning();
        return inserida;
      })
    );
    console.log(`${modalidadesInseridas.length} modalidades inseridas.`);

    // Inserir Valores Fixos
    const [valoresFixos] = await db.insert(schema.valoresFixos).values({
      receitaPorAluno: "28.00", 
      custoFixoPorAula: "78.00"
    }).returning();
    console.log("Valores fixos inseridos:", valoresFixos);

    // Inserir Usuários (professores e admin)
    const senhaHash = hashSync("senha123", 10);

    const usuariosPredefinidos = [
      { nome: "Admin Sistema", email: "admin@exemplo.com", senhaHash, role: "admin" },
      { nome: "Carlos Ferreira", email: "carlos@exemplo.com", senhaHash, role: "professor" },
      { nome: "Ana Souza", email: "ana@exemplo.com", senhaHash, role: "professor" },
      { nome: "Rafael Oliveira", email: "rafael@exemplo.com", senhaHash, role: "professor" },
      { nome: "Maria Silva", email: "maria@exemplo.com", senhaHash, role: "professor" },
      { nome: "Pedro Almeida", email: "pedro@exemplo.com", senhaHash, role: "professor" }
    ];

    const usuariosInseridos = await Promise.all(
      usuariosPredefinidos.map(async (usuario) => {
        const [inserido] = await db.insert(schema.professores).values(usuario).returning();
        return inserido;
      })
    );
    console.log(`${usuariosInseridos.length} usuários inseridos.`);

    // Criar algumas aulas demonstrativas
    const hoje = new Date();
    const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const horarios = ["08:00", "10:00", "18:00"];

    // Gerar datas das aulas para o mês atual
    const datasAulas: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() - 15 + i); // 15 dias para trás e 15 para frente
      
      // Excluir domingos (0 = domingo na getDay())
      if (data.getDay() !== 0) {
        datasAulas.push(data);
      }
    }

    console.log(`Gerando aulas para ${datasAulas.length} dias...`);

    // Para cada data, criar aulas em horários diferentes
    for (const data of datasAulas) {
      for (const horario of horarios) {
        // Não criar todas as aulas para todos os horários e dias
        if (Math.random() > 0.7) continue;

        const modalidadeId = modalidadesInseridas[Math.floor(Math.random() * modalidadesInseridas.length)].id;
        const capacidade = 20 + Math.floor(Math.random() * 10); // Capacidade entre 20 e 29

        // Criar a aula
        const [aula] = await db.insert(schema.aulas).values({
          data: data,
          horaInicio: horario,
          capacidade,
          modalidadeId
        }).returning();

        console.log(`Aula criada para ${data.toISOString().split('T')[0]} às ${horario}`);

        // Associar professores aleatórios a esta aula
        const numProfessores = 1 + Math.floor(Math.random() * 2); // 1 ou 2 professores
        
        const professoresIds = [];
        for (let i = 0; i < numProfessores; i++) {
          // Excluir admin do sorteio de professores
          const professorIndex = 1 + Math.floor(Math.random() * (usuariosInseridos.length - 1));
          if (!professoresIds.includes(usuariosInseridos[professorIndex].id)) {
            professoresIds.push(usuariosInseridos[professorIndex].id);
          }
        }

        for (const professorId of professoresIds) {
          const cargoId = cargosInseridos[Math.floor(Math.random() * cargosInseridos.length)].id;
          const patenteId = patentesInseridas[Math.floor(Math.random() * patentesInseridas.length)].id;

          await db.insert(schema.aulaProfessores).values({
            aulaId: aula.id,
            professorId,
            cargoId,
            patenteId
          });

          console.log(`- Professor ${professorId} associado à aula ${aula.id}`);

          // Para aulas no passado, criar check-ins
          if (data < hoje) {
            const quantidadeAlunos = Math.floor(Math.random() * (capacidade + 1));
            
            await db.insert(schema.checkins).values({
              aulaId: aula.id,
              professorId,
              quantidadeAlunos,
              createdAt: data
            });

            console.log(`  - Check-in criado com ${quantidadeAlunos} alunos`);
          }
        }
      }
    }

    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed do banco de dados:", error);
  }
}

seed();
