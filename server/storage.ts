import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, gte, lte, sql, count, avg, sum, gt, lt, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const storage = {
  // Valores Fixos
  async getValoresFixos() {
    try {
      // Tentar criar a tabela se ela não existir
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS valores_fixos (
          id SERIAL PRIMARY KEY,
          receita_por_aluno DECIMAL(10,2) NOT NULL,
          custo_fixo_por_aula DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Verifique se há registros na tabela
      const registros = await db.execute(sql`SELECT COUNT(*) FROM valores_fixos`);
      const count = parseInt(registros.rows[0].count);
      
      // Se não houver registros, insira um valor padrão
      if (count === 0) {
        await db.execute(sql`
          INSERT INTO valores_fixos (receita_por_aluno, custo_fixo_por_aula)
          VALUES ('28.00', '78.00')
        `);
      }
      
      // Busque o valor mais recente
      const valores = await db.execute(sql`
        SELECT * FROM valores_fixos 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      if (valores.rows.length > 0) {
        return {
          id: valores.rows[0].id,
          receitaPorAluno: valores.rows[0].receita_por_aluno,
          custoFixoPorAula: valores.rows[0].custo_fixo_por_aula,
          createdAt: valores.rows[0].created_at,
          updatedAt: valores.rows[0].updated_at
        };
      }
      
      return { receitaPorAluno: "28.00", custoFixoPorAula: "78.00" };
    } catch (error) {
      console.error("Erro ao acessar valores fixos:", error);
      return { receitaPorAluno: "28.00", custoFixoPorAula: "78.00" };
    }
  },

  async criarOuAtualizarValoresFixos(data: schema.ValoresFixosInsert) {
    try {
      // Garantir que a tabela existe
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS valores_fixos (
          id SERIAL PRIMARY KEY,
          receita_por_aluno DECIMAL(10,2) NOT NULL,
          custo_fixo_por_aula DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Verificar se já existe algum registro
      const result = await db.execute(sql`SELECT id FROM valores_fixos LIMIT 1`);
      
      if (result.rows.length > 0) {
        const id = result.rows[0].id;
        // Atualizar o registro existente
        await db.execute(sql`
          UPDATE valores_fixos 
          SET receita_por_aluno = ${data.receitaPorAluno},
              custo_fixo_por_aula = ${data.custoFixoPorAula},
              updated_at = NOW()
          WHERE id = ${id}
        `);
        
        const updated = await db.execute(sql`SELECT * FROM valores_fixos WHERE id = ${id}`);
        return [{
          id: updated.rows[0].id,
          receitaPorAluno: updated.rows[0].receita_por_aluno,
          custoFixoPorAula: updated.rows[0].custo_fixo_por_aula,
          createdAt: updated.rows[0].created_at,
          updatedAt: updated.rows[0].updated_at
        }];
      } else {
        // Criar um novo registro
        const inserted = await db.execute(sql`
          INSERT INTO valores_fixos (receita_por_aluno, custo_fixo_por_aula)
          VALUES (${data.receitaPorAluno}, ${data.custoFixoPorAula})
          RETURNING *
        `);
        
        return [{
          id: inserted.rows[0].id,
          receitaPorAluno: inserted.rows[0].receita_por_aluno,
          custoFixoPorAula: inserted.rows[0].custo_fixo_por_aula,
          createdAt: inserted.rows[0].created_at,
          updatedAt: inserted.rows[0].updated_at
        }];
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar valores fixos:", error);
      return [{
        id: 1,
        receitaPorAluno: data.receitaPorAluno,
        custoFixoPorAula: data.custoFixoPorAula,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
  },
  
  // Usuários (Professores)
  async getUserByEmail(email: string | null | undefined) {
    // Se o email for null ou undefined, retorna null, pois não podemos buscar por um email que não existe
    if (!email) return null;
    
    return await db.query.professores.findFirst({
      where: eq(schema.professores.email, email)
    });
  },

  async getUserById(id: number) {
    return await db.query.professores.findFirst({
      where: eq(schema.professores.id, id)
    });
  },

  async verifyPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  },

  async createUser(data: schema.ProfessorInsert & { senha: string }) {
    console.log("createUser recebeu:", data);
    // Garantir uma senha padrão se não for fornecida
    const senha = data.senha || "senha123";
    const { senha: _, ...userData } = data;
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    console.log("Hash da senha criado");
    
    // Inserir no banco
    console.log("Inserindo no banco:", { ...userData, senhaHash });
    const result = await db.insert(schema.professores)
      .values({ ...userData, senhaHash })
      .returning();
    
    console.log("Resultado da inserção:", result);
    return result;
  },

  async listUsers() {
    return await db.query.professores.findMany({
      orderBy: [schema.professores.nome]
    });
  },

  async listProfessores() {
    return await db.query.professores.findMany({
      where: eq(schema.professores.role, "professor"),
      orderBy: [schema.professores.nome]
    });
  },
  
  async updateUser(id: number, data: Partial<Omit<schema.ProfessorInsert, 'senhaHash'>> & { senha?: string }) {
    const { senha, ...userData } = data;
    let updateData = { ...userData };
    
    // Se senha foi fornecida, atualizar hash da senha
    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      updateData = { ...updateData, senhaHash };
    }
    
    return await db.update(schema.professores)
      .set(updateData)
      .where(eq(schema.professores.id, id))
      .returning();
  },
  
  async deleteUser(id: number) {
    return await db.delete(schema.professores)
      .where(eq(schema.professores.id, id))
      .returning();
  },

  // Modalidades
  async listModalidades() {
    return await db.query.modalidades.findMany({
      orderBy: [schema.modalidades.nome]
    });
  },
  
  async criarModalidade(data: schema.ModalidadeInsert) {
    return await db.insert(schema.modalidades)
      .values(data)
      .returning();
  },
  
  async atualizarModalidade(id: number, data: Partial<schema.ModalidadeInsert>) {
    return await db.update(schema.modalidades)
      .set(data)
      .where(eq(schema.modalidades.id, id))
      .returning();
  },
  
  async deletarModalidade(id: number) {
    return await db.delete(schema.modalidades)
      .where(eq(schema.modalidades.id, id))
      .returning();
  },

  // Cargos
  async listCargos() {
    return await db.query.cargos.findMany({
      orderBy: [schema.cargos.nome]
    });
  },
  
  async criarCargo(data: schema.CargoInsert) {
    return await db.insert(schema.cargos)
      .values(data)
      .returning();
  },
  
  async atualizarCargo(id: number, data: Partial<schema.CargoInsert>) {
    return await db.update(schema.cargos)
      .set(data)
      .where(eq(schema.cargos.id, id))
      .returning();
  },
  
  async deletarCargo(id: number) {
    return await db.delete(schema.cargos)
      .where(eq(schema.cargos.id, id))
      .returning();
  },

  // Patentes
  async listPatentes() {
    return await db.query.patentes.findMany({
      orderBy: [schema.patentes.nome]
    });
  },
  
  async criarPatente(data: schema.PatenteInsert) {
    return await db.insert(schema.patentes)
      .values(data)
      .returning();
  },
  
  async atualizarPatente(id: number, data: Partial<schema.PatenteInsert>) {
    return await db.update(schema.patentes)
      .set(data)
      .where(eq(schema.patentes.id, id))
      .returning();
  },
  
  async deletarPatente(id: number) {
    return await db.delete(schema.patentes)
      .where(eq(schema.patentes.id, id))
      .returning();
  },

  // Aulas
  async createAula(data: {
    modalidadeId: number;
    data: Date;
    horaInicio: string;
    capacidade: number;
    professores: Array<{
      professorId: number;
      cargoId: number;
      patenteId: number;
    }>;
  }) {
    // Inserir aula
    try {
      // Inserir aula
      const query = sql`
        INSERT INTO aulas (data, hora_inicio, capacidade, modalidade_id)
        VALUES (${data.data.toISOString()}, ${data.horaInicio}, ${data.capacidade}, ${data.modalidadeId})
        RETURNING *
      `;
      
      const result = await db.execute(query);
      const novaAula = result.rows[0];
      
      // Inserir professores
      if (data.professores && data.professores.length > 0) {
        for (const professor of data.professores) {
          await db.execute(sql`
            INSERT INTO aula_professores (aula_id, professor_id, cargo_id, patente_id)
            VALUES (${novaAula.id}, ${professor.professorId}, ${professor.cargoId}, ${professor.patenteId})
          `);
        }
      }
      
      return novaAula;
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      throw error;
    }
  },

  async getAulasDisponiveisCheckin() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Obter aulas para hoje e futuro próximo (7 dias)
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      const query = sql`
        SELECT a.id, a.data, a.hora_inicio, a.capacidade, m.nome as modalidade_nome 
        FROM aulas a
        INNER JOIN modalidades m ON a.modalidade_id = m.id
        WHERE a.data >= ${today.toISOString()} AND a.data <= ${endDate.toISOString()}
        ORDER BY a.data, a.hora_inicio
      `;
      
      const result = await db.execute(query);
      
      return result.rows.map(a => ({
        id: a.id,
        data: a.data,
        horaInicio: a.hora_inicio,
        capacidade: a.capacidade,
        modalidade: a.modalidade_nome
      }));
    } catch (error) {
      console.error("Erro ao buscar aulas disponíveis para check-in:", error);
      return [];
    }
  },
  
  async createAulasEmSerie(data: {
    modalidadeId: number;
    diasSemana: number[];
    horaInicio: string;
    dataInicio: Date;
    dataFim: Date;
    capacidade: number;
    professores: Array<{
      professorId: number;
      cargoId: number;
      patenteId: number;
    }>;
  }) {
    // Definimos o array fora do bloco try/catch para que esteja disponível no catch
    const aulasInseridas: any[] = [];
    
    try {
      // Configurar datas
      const dataInicio = new Date(data.dataInicio);
      const dataFim = new Date(data.dataFim);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);
      
      // Verificar datas
      if (dataInicio > dataFim) {
        throw new Error("Data de início deve ser anterior à data de fim");
      }
      
      // Verificar se há dias da semana selecionados
      if (!data.diasSemana || data.diasSemana.length === 0) {
        throw new Error("Selecione pelo menos um dia da semana");
      }
      
      // Gerar todas as datas dentro do intervalo para os dias da semana selecionados
      const datas: Date[] = [];
      let currentDate = new Date(dataInicio);
      
      while (currentDate <= dataFim) {
        const diaSemana = currentDate.getDay(); // 0 (domingo) a 6 (sábado)
        
        if (data.diasSemana.includes(diaSemana)) {
          datas.push(new Date(currentDate));
        }
        
        // Avançar para o próximo dia
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Gerando ${datas.length} aulas para os dias da semana selecionados`);
      
      // Processamos em lotes menores para evitar sobrecarga no banco de dados
      const tamLote = 3;
      
      // Processamos cada lote de datas
      for (let i = 0; i < datas.length; i += tamLote) {
        try {
          const loteDatas = datas.slice(i, i + tamLote);
          console.log(`Processando lote ${Math.floor(i / tamLote) + 1} de ${Math.ceil(datas.length / tamLote)}, com ${loteDatas.length} aulas`);
          
          for (const data_aula of loteDatas) {
            try {
              // Verificar se não há duplicidade
              const aulas_existentes = await db.execute(sql`
                SELECT * FROM aulas 
                WHERE modalidade_id = ${data.modalidadeId} 
                AND data = ${data_aula.toISOString()} 
                AND hora_inicio = ${data.horaInicio}
              `);
              
              if (aulas_existentes.rows.length > 0) {
                console.log(`Aula já existe para ${data_aula.toDateString()} às ${data.horaInicio}, pulando...`);
                continue; // Pular esta data pois já existe aula
              }
              
              // Inserir aula
              const query = sql`
                INSERT INTO aulas (data, hora_inicio, capacidade, modalidade_id)
                VALUES (${data_aula.toISOString()}, ${data.horaInicio}, ${data.capacidade}, ${data.modalidadeId})
                RETURNING *
              `;
              
              const result = await db.execute(query);
              const novaAula = result.rows[0];
              
              // Inserir professores
              if (data.professores && data.professores.length > 0) {
                for (const professor of data.professores) {
                  await db.execute(sql`
                    INSERT INTO aula_professores (aula_id, professor_id, cargo_id, patente_id)
                    VALUES (${novaAula.id}, ${professor.professorId}, ${professor.cargoId}, ${professor.patenteId})
                  `);
                }
              }
              
              aulasInseridas.push(novaAula);
              console.log(`Aula criada com sucesso para ${data_aula.toDateString()} às ${data.horaInicio}`);
            } catch (aulaError) {
              console.error(`Erro ao criar aula para ${data_aula.toDateString()} às ${data.horaInicio}:`, aulaError);
              // Continuamos processando as outras aulas do lote mesmo se uma falhar
            }
          }
          
          // Pequena pausa entre lotes para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (loteError) {
          console.error(`Erro ao processar lote ${Math.floor(i / tamLote) + 1}:`, loteError);
          // Continuamos com o próximo lote mesmo se um falhar
        }
      }
      
      // Se chegamos aqui sem erros, retornamos as aulas criadas
      return {
        totalAulas: aulasInseridas.length,
        aulas: aulasInseridas
      };
    } catch (error) {
      console.error("Erro ao criar aulas em série:", error);
      // Se houver algum erro geral, verificamos se conseguimos criar pelo menos algumas aulas
      if (aulasInseridas.length > 0) {
        return {
          totalAulas: aulasInseridas.length,
          aulas: aulasInseridas,
          warning: "Algumas aulas foram criadas, mas ocorreram erros. Verifique os logs para mais detalhes."
        };
      }
      throw error;
    }
  },
  
  async getAllAulas(params: { 
    modalidadeId?: number, 
    diaSemana?: string, 
    dataInicio?: string, 
    dataFim?: string,
    busca?: string
  }) {
    try {
      let query = sql`
        SELECT 
          a.id, 
          a.data, 
          a.hora_inicio, 
          a.capacidade, 
          a.alunos_presentes,
          m.nome as modalidade_nome,
          m.id as modalidade_id
        FROM aulas a
        INNER JOIN modalidades m ON a.modalidade_id = m.id
      `;
      
      const conditions = [];
      
      if (params.modalidadeId) {
        conditions.push(sql`m.id = ${params.modalidadeId}`);
      }
      
      if (params.diaSemana) {
        // PostgreSQL: 0 = domingo, 1 = segunda, etc.
        // Converter nomes de dia da semana para números
        const diasSemanaMap: {[key: string]: number} = {
          'domingo': 0,
          'segunda': 1,
          'terca': 2,
          'terça': 2,
          'quarta': 3,
          'quinta': 4,
          'sexta': 5,
          'sabado': 6,
          'sábado': 6
        };
        
        const diaSemanaNumero = diasSemanaMap[params.diaSemana.toLowerCase()];
        if (diaSemanaNumero !== undefined) {
          conditions.push(sql`EXTRACT(DOW FROM a.data) = ${diaSemanaNumero}`);
        }
      }
      
      if (params.dataInicio) {
        conditions.push(sql`a.data >= ${params.dataInicio}`);
      }
      
      if (params.dataFim) {
        conditions.push(sql`a.data <= ${params.dataFim}`);
      }
      
      if (params.busca) {
        // Busca por modalidade ou professor com JOIN
        conditions.push(sql`(
          LOWER(m.nome) LIKE LOWER(${'%' + params.busca + '%'})
          OR EXISTS (
            SELECT 1 FROM aula_professores ap
            JOIN professores p ON ap.professor_id = p.id
            WHERE ap.aula_id = a.id AND LOWER(p.nome) LIKE LOWER(${'%' + params.busca + '%'})
          )
        )`);
      }
      
      if (conditions.length > 0) {
        query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
      }
      
      query = sql`${query} ORDER BY a.data, a.hora_inicio`;
      
      const result = await db.execute(query);
      
      // Obter professores para cada aula
      const aulas = await Promise.all(result.rows.map(async (aula) => {
        try {
          const professoresQuery = sql`
            SELECT 
              p.id as professor_id,
              p.nome as professor_nome,
              c.nome as cargo_nome,
              pt.nome as patente_nome
            FROM aula_professores ap
            JOIN professores p ON ap.professor_id = p.id
            JOIN cargos c ON ap.cargo_id = c.id
            JOIN patentes pt ON ap.patente_id = pt.id
            WHERE ap.aula_id = ${aula.id}
          `;
          
          const professoresResult = await db.execute(professoresQuery);
          
          return {
            id: aula.id,
            data: aula.data,
            horaInicio: aula.hora_inicio,
            capacidade: aula.capacidade,
            alunosPresentes: aula.alunos_presentes || 0,
            modalidade: aula.modalidade_nome,
            modalidadeId: aula.modalidade_id,
            professores: professoresResult.rows.map((p) => ({
              id: p.professor_id,
              nome: p.professor_nome,
              cargo: p.cargo_nome,
              patente: p.patente_nome
            }))
          };
        } catch (error) {
          console.error(`Erro ao buscar professores para aula ${aula.id}:`, error);
          return {
            id: aula.id,
            data: aula.data,
            horaInicio: aula.hora_inicio,
            capacidade: aula.capacidade,
            alunosPresentes: aula.alunos_presentes || 0,
            modalidade: aula.modalidade_nome,
            modalidadeId: aula.modalidade_id,
            professores: []
          };
        }
      }));
      
      return aulas;
    } catch (error) {
      console.error("Erro ao buscar aulas:", error);
      return [];
    }
  },
  
  async getProfessoresDaAula(aulaId: number) {
    try {
      const query = sql`
        SELECT 
          p.id,
          p.nome,
          c.nome as cargo,
          pt.nome as patente
        FROM aula_professores ap
        JOIN professores p ON ap.professor_id = p.id
        JOIN cargos c ON ap.cargo_id = c.id
        JOIN patentes pt ON ap.patente_id = pt.id
        WHERE ap.aula_id = ${aulaId}
      `;
      
      const result = await db.execute(query);
      
      return result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        cargo: row.cargo,
        patente: row.patente
      }));
    } catch (error) {
      console.error("Erro ao buscar professores da aula:", error);
      return [];
    }
  },
  
  async atualizarAlunosPresentes(aulaId: number, alunosPresentes: number) {
    try {
      const query = sql`
        UPDATE aulas
        SET alunos_presentes = ${alunosPresentes}
        WHERE id = ${aulaId}
        RETURNING *
      `;
      
      const result = await db.execute(query);
      
      if (result.rows.length === 0) {
        throw new Error("Aula não encontrada");
      }
      
      return {
        id: result.rows[0].id,
        data: result.rows[0].data,
        horaInicio: result.rows[0].hora_inicio,
        capacidade: result.rows[0].capacidade,
        alunosPresentes: result.rows[0].alunos_presentes,
        modalidadeId: result.rows[0].modalidade_id
      };
    } catch (error) {
      console.error("Erro ao atualizar alunos presentes:", error);
      throw error;
    }
  },
  
  async getAulasComPresenca(limit = 10) {
    try {
      const query = sql`
        SELECT 
          a.id,
          a.data,
          a.hora_inicio,
          a.alunos_presentes,
          a.capacidade,
          m.nome as modalidade
        FROM aulas a
        JOIN modalidades m ON a.modalidade_id = m.id
        WHERE a.alunos_presentes > 0
        ORDER BY a.data DESC
        LIMIT ${limit}
      `;
      
      const result = await db.execute(query);
      
      return result.rows.map(row => ({
        id: row.id,
        data: row.data,
        horaInicio: row.hora_inicio,
        alunosPresentes: row.alunos_presentes,
        capacidade: row.capacidade,
        modalidade: row.modalidade
      }));
    } catch (error) {
      console.error("Erro ao buscar aulas com presença:", error);
      return [];
    }
  },
  
  async getAulasPresencaPorProfessor(professorId: number, limit = 10) {
    try {
      const query = sql`
        SELECT 
          a.id,
          a.data,
          a.hora_inicio,
          a.alunos_presentes,
          a.capacidade,
          m.nome as modalidade
        FROM aulas a
        JOIN modalidades m ON a.modalidade_id = m.id
        JOIN aula_professores ap ON a.id = ap.aula_id
        WHERE ap.professor_id = ${professorId}
        AND a.alunos_presentes > 0
        ORDER BY a.data DESC
        LIMIT ${limit}
      `;
      
      const result = await db.execute(query);
      
      return result.rows.map(row => ({
        id: row.id,
        data: row.data,
        horaInicio: row.hora_inicio,
        alunosPresentes: row.alunos_presentes,
        capacidade: row.capacidade,
        modalidade: row.modalidade
      }));
    } catch (error) {
      console.error("Erro ao buscar aulas com presença por professor:", error);
      return [];
    }
  },
  
  // Dashboard
  async getDashboardMetrics(mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Mês anterior para comparação
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anoAnterior = mes === 1 ? ano - 1 : ano;
      const dataInicioAnterior = new Date(anoAnterior, mesAnterior - 1, 1);
      const dataFimAnterior = new Date(anoAnterior, mesAnterior, 0);
      const dataInicioAnteriorSQL = dataInicioAnterior.toISOString().split('T')[0];
      const dataFimAnteriorSQL = dataFimAnterior.toISOString().split('T')[0];
      
      // Total de aulas no mês atual
      const queryAulas = await db.execute(sql`
        SELECT COUNT(*) as total FROM aulas
        WHERE data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
      `);
      const totalAulas = parseInt(queryAulas.rows[0].total) || 0;
      
      // Ocupação média - corrigido para considerar todas as aulas, não apenas as com alunos presentes
      const queryOcupacao = await db.execute(sql`
        SELECT 
          AVG(CASE WHEN capacidade > 0 THEN (alunos_presentes::float / capacidade) * 100 ELSE 0 END) as ocupacao
        FROM aulas
        WHERE data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
      `);
      const ocupacaoMedia = Math.round(parseFloat(queryOcupacao.rows[0]?.ocupacao || '0')) || 0;
      
      // Receita total
      // Calcular com base nos valores fixos e presença
      const valoresFixos = await this.getValoresFixos();
      const receitaPorAluno = parseFloat(valoresFixos.receitaPorAluno || "28.00");
      
      const queryAlunos = await db.execute(sql`
        SELECT SUM(alunos_presentes) as total FROM aulas
        WHERE data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
      `);
      const totalAlunos = parseInt(queryAlunos.rows[0]?.total || '0') || 0;
      
      const receitaTotal = totalAlunos * receitaPorAluno;
      
      // Custo total
      const custoFixoPorAula = parseFloat(valoresFixos.custoFixoPorAula || "78.00");
      const custoFixoTotal = totalAulas * custoFixoPorAula;
      
      // Custos de professores (cargos)
      const queryCargos = await db.execute(sql`
        SELECT SUM(c.valor_hora_aula::float) as total
        FROM aula_professores ap
        JOIN cargos c ON ap.cargo_id = c.id
        JOIN aulas a ON ap.aula_id = a.id
        WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
      `);
      const custoCargos = parseFloat(queryCargos.rows[0]?.total || '0') || 0;
      
      // Custos de patentes (multiplicadores por aluno)
      const queryPatentes = await db.execute(sql`
        SELECT 
          SUM(pt.multiplicador_por_aluno::float * a.alunos_presentes) as total
        FROM aula_professores ap
        JOIN patentes pt ON ap.patente_id = pt.id
        JOIN aulas a ON ap.aula_id = a.id
        WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
        AND a.alunos_presentes > 0
      `);
      const custoPatentes = parseFloat(queryPatentes.rows[0]?.total || '0') || 0;
      
      const custoTotal = custoFixoTotal + custoCargos + custoPatentes;
      const resultadoLiquido = receitaTotal - custoTotal;
      
      // Métricas do mês anterior para cálculo de crescimento
      const queryAulasAnterior = await db.execute(sql`
        SELECT COUNT(*) as total FROM aulas
        WHERE data BETWEEN ${dataInicioAnteriorSQL} AND ${dataFimAnteriorSQL}
      `);
      const totalAulasAnterior = parseInt(queryAulasAnterior.rows[0]?.total || '0') || 1; // Evitar divisão por zero
      
      const queryOcupacaoAnterior = await db.execute(sql`
        SELECT 
          AVG(CASE WHEN capacidade > 0 THEN (alunos_presentes::float / capacidade) * 100 ELSE 0 END) as ocupacao
        FROM aulas
        WHERE data BETWEEN ${dataInicioAnteriorSQL} AND ${dataFimAnteriorSQL}
      `);
      const ocupacaoMediaAnterior = Math.round(parseFloat(queryOcupacaoAnterior.rows[0]?.ocupacao || '0')) || 1;
      
      const queryAlunosAnterior = await db.execute(sql`
        SELECT SUM(alunos_presentes) as total FROM aulas
        WHERE data BETWEEN ${dataInicioAnteriorSQL} AND ${dataFimAnteriorSQL}
      `);
      const totalAlunosAnterior = parseInt(queryAlunosAnterior.rows[0]?.total || '0') || 0;
      
      const receitaTotalAnterior = totalAlunosAnterior * receitaPorAluno;
      
      const custoFixoTotalAnterior = totalAulasAnterior * custoFixoPorAula;
      
      const queryCargosAnterior = await db.execute(sql`
        SELECT SUM(c.valor_hora_aula::float) as total
        FROM aula_professores ap
        JOIN cargos c ON ap.cargo_id = c.id
        JOIN aulas a ON ap.aula_id = a.id
        WHERE a.data BETWEEN ${dataInicioAnteriorSQL} AND ${dataFimAnteriorSQL}
      `);
      const custoCargosAnterior = parseFloat(queryCargosAnterior.rows[0]?.total || '0') || 0;
      
      const queryPatentesAnterior = await db.execute(sql`
        SELECT 
          SUM(pt.multiplicador_por_aluno::float * a.alunos_presentes) as total
        FROM aula_professores ap
        JOIN patentes pt ON ap.patente_id = pt.id
        JOIN aulas a ON ap.aula_id = a.id
        WHERE a.data BETWEEN ${dataInicioAnteriorSQL} AND ${dataFimAnteriorSQL}
        AND a.alunos_presentes > 0
      `);
      const custoPatentesAnterior = parseFloat(queryPatentesAnterior.rows[0]?.total || '0') || 0;
      
      const custoTotalAnterior = custoFixoTotalAnterior + custoCargosAnterior + custoPatentesAnterior;
      const resultadoLiquidoAnterior = receitaTotalAnterior - custoTotalAnterior;
      
      // Calcular crescimento
      const crescimentoAulas = Math.round(((totalAulas - totalAulasAnterior) / totalAulasAnterior) * 100);
      const crescimentoOcupacao = Math.round(((ocupacaoMedia - ocupacaoMediaAnterior) / ocupacaoMediaAnterior) * 100);
      const crescimentoReceita = Math.round(((receitaTotal - receitaTotalAnterior) / (receitaTotalAnterior || 1)) * 100);
      const crescimentoResultado = resultadoLiquidoAnterior !== 0 
        ? Math.round(((resultadoLiquido - resultadoLiquidoAnterior) / Math.abs(resultadoLiquidoAnterior)) * 100)
        : resultadoLiquido > 0 ? 100 : 0;
        
      return {
        totalAulas,
        ocupacaoMedia,
        receitaTotal,
        resultadoLiquido,
        crescimentoAulas,
        crescimentoOcupacao,
        crescimentoReceita,
        crescimentoResultado
      };
    } catch (error) {
      console.error("Erro ao obter métricas do dashboard:", error);
      return {
        totalAulas: 0,
        ocupacaoMedia: 0,
        receitaTotal: 0,
        resultadoLiquido: 0,
        crescimentoAulas: 0,
        crescimentoOcupacao: 0,
        crescimentoReceita: 0,
        crescimentoResultado: 0
      };
    }
  },
  
  async getHorariosAulas(mesAno: string, filtros?: { modalidadeId?: number, professorId?: number }) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Construir a consulta SQL com filtros opcionais
      let query = sql`
        SELECT 
          m.nome as "modalidade", 
          m.id as "modalidadeId",
          EXTRACT(DOW FROM a.data::timestamp) as "diaSemana",
          a.hora_inicio as "horaInicio",
          COUNT(*) as "quantidadeAulas",
          AVG(a.alunos_presentes) as "mediaAlunos",
          SUM(a.alunos_presentes) as "somaAlunos",
          MAX(a.capacidade) as "capacidade"
        FROM aulas a
        JOIN modalidades m ON a.modalidade_id = m.id
      `;
      
      // Adiciona condição de filtro por professor se fornecido
      if (filtros?.professorId) {
        query = sql`
          ${query}
          JOIN aula_professores ap ON a.id = ap.aula_id
          WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
          AND ap.professor_id = ${filtros.professorId}
        `;
      } else {
        query = sql`
          ${query}
          WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
        `;
      }
      
      // Adiciona condição de filtro por modalidade se fornecido
      if (filtros?.modalidadeId) {
        query = sql`
          ${query}
          AND m.id = ${filtros.modalidadeId}
        `;
      }
      
      // Finaliza a consulta com GROUP BY e ORDER BY
      query = sql`
        ${query}
        GROUP BY m.nome, m.id, EXTRACT(DOW FROM a.data::timestamp), a.hora_inicio
        ORDER BY a.hora_inicio, "diaSemana"
      `;
      
      const aulasGroupedResult = await db.execute(query);
      const aulasGrouped = aulasGroupedResult.rows.map(row => ({
        modalidade: row.modalidade,
        modalidadeId: Number(row.modalidadeId || 0),
        diaSemana: Number(row.diaSemana),
        horaInicio: row.horaInicio,
        quantidadeAulas: Number(row.quantidadeAulas) || 0,
        mediaAlunos: Number(row.mediaAlunos) || 0,
        somaAlunos: Number(row.somaAlunos) || 0,
        capacidade: Number(row.capacidade) || 0
      }));
      
      // Processar e formatar os dados para a grade de horários
      // Converter o dia da semana (0 = domingo, 1 = segunda, etc.) para o formato esperado
      const diasSemanaMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      
      // Obter todos os horários distintos das aulas diretamente do banco
      const horariosQuery = await db.execute(sql`
        SELECT DISTINCT hora_inicio 
        FROM aulas 
        WHERE data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
        ORDER BY hora_inicio
      `);
      
      // Extrair os horários únicos da consulta
      const horariosUnicos = horariosQuery.rows.map(row => row.hora_inicio);
      
      // Preparar estrutura de dados: { horario: { diaSemana: array de dados } }
      const horariosGrid: Record<string, Record<string, any[]>> = {};
      
      // Inicializar a grade com todos os horários encontrados no banco
      horariosUnicos.forEach(horario => {
        horariosGrid[horario] = {};
        diasSemanaMap.slice(1, 7).forEach(dia => { // Excluir domingo
          horariosGrid[horario][dia] = []; // Inicializa como array vazio em vez de null
        });
      });
      
      // Obter valores fixos do sistema
      const valoresFixos = await this.getValoresFixos();
      const receitaPorAluno = parseFloat(String(valoresFixos.receitaPorAluno));
      const custoFixoPorAula = parseFloat(String(valoresFixos.custoFixoPorAula));
      
      // Preencher a grade com os dados das aulas
      for (const aula of aulasGrouped) {
        const diaSemana = diasSemanaMap[aula.diaSemana];
        const horario = aula.horaInicio;
        
        // Ignorar domingos e verificar se o horário existe na grade
        if (diaSemana !== "Domingo" && horario in horariosGrid) {
          // Obter total de alunos e capacidade total
          const totalAlunos = Number(aula.somaAlunos) || 0;
          const numAulas = Number(aula.quantidadeAulas) || 0;
          const capacidade = Number(aula.capacidade);
          
          // Calcular ocupação conforme a nova fórmula: (total de check-ins ÷ (capacidade × total de aulas)) × 100%
          const capacidadeTotal = capacidade * numAulas;
          const ocupacao = capacidadeTotal > 0 ? Math.round((totalAlunos / capacidadeTotal) * 100) : 0;
          
          // Receita = total de alunos × valor por aluno
          const receita = totalAlunos * receitaPorAluno;
          
          // Custo mais preciso baseado nos valores reais
          const custoBase = custoFixoPorAula;
          // Valores mais precisos para cargo e patente baseados em dados reais
          const custoCargoMedio = 29.87; // Valor médio dos cargos por aula (verificado no log)
          const custoPatenteTotal = totalAlunos * 1.25; // Multiplicador médio para todos os alunos
          
          // Cálculo do custo total
          const custo = (numAulas * (custoBase + custoCargoMedio)) + custoPatenteTotal;
        
          // Cálculo de resultado padrão como fallback
          const resultadoPadrao = receita - custo;
          
          try {
            // Tentar obter dados detalhados do endpoint de detalhes
            // Isso pode falhar para algumas aulas sem detalhes suficientes
            const classDetailId = `${horario}-${diaSemana}-${aula.modalidade}`;
            console.log(`Obtendo detalhes para ${classDetailId} - Mês/Ano: ${mes}/${ano}`);
            
            const detalhes = await this.getClassDetail(classDetailId, `${mes}/${ano}`);
            
            if (!detalhes) {
              console.log(`Não foi possível obter detalhes para: ${classDetailId}`);
              throw new Error("Detalhes não encontrados");
            }
            
            const resultadoFinanceiro = detalhes.valores.resultadoMensal;
            console.log(`Resultado financeiro para ${classDetailId}: ${resultadoFinanceiro}`);
            
            // Adicionar ao array em vez de substituir
            horariosGrid[horario][diaSemana].push({
              id: classDetailId,
              modalidade: aula.modalidade,
              numAulas,
              totalAlunos,
              receita,
              custo,
              resultado: resultadoFinanceiro,
              ocupacao
            });
          } catch (error) {
            // Fallback para o cálculo estimado em caso de erro
            console.log(`Erro ao obter detalhes para ${horario}-${diaSemana}-${aula.modalidade}:`, error);
            console.log(`Usando cálculo padrão: Receita ${receita} - Custo ${custo} = Resultado ${resultadoPadrao}`);
            
            // Adicionar ao array em vez de substituir
            horariosGrid[horario][diaSemana].push({
              id: `${horario}-${diaSemana}-${aula.modalidade}`,
              modalidade: aula.modalidade,
              numAulas,
              totalAlunos,
              receita,
              custo,
              resultado: resultadoPadrao,
              ocupacao
            });
          }
        }
      }
      
      return horariosGrid;
    } catch (error) {
      console.error("Erro ao obter horários de aulas:", error);
      return {};
    }
  },
  
  async getClassDetail(classId: string, mesAno: string) {
    try {
      // Extrair modalidade, dia e horário do ID composto
      const [horario, diaSemana, modalidade] = classId.split('-');
      
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Mapear dia da semana para número
      const diaSemanaMap: Record<string, number> = {
        "Segunda": 1,
        "Terça": 2,
        "Quarta": 3,
        "Quinta": 4, 
        "Sexta": 5,
        "Sábado": 6
      };
      
      console.log(`Buscando aulas para: Modalidade=${modalidade}, Dia=${diaSemana}, Horário=${horario}, Período=${dataInicioSQL} até ${dataFimSQL}`);
      
      // Obter aulas correspondentes com SQL direto para garantir que estamos capturando todas as aulas com a mesma modalidade/dia/horário
      const aulasQuery = sql`
        SELECT 
          a.id, 
          a.data, 
          a.hora_inicio as "horaInicio", 
          a.capacidade,
          m.nome as "modalidade",
          EXTRACT(DOW FROM a.data::timestamp) as "diaSemana"
        FROM aulas a
        JOIN modalidades m ON a.modalidade_id = m.id
        WHERE 
          a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
          AND a.hora_inicio = ${horario}
          AND m.nome = ${modalidade}
          AND EXTRACT(DOW FROM a.data::timestamp) = ${diaSemanaMap[diaSemana]}
      `;
      
      const aulasResult = await db.execute(aulasQuery);
      const aulas = aulasResult.rows.map(row => ({
        id: row.id,
        data: row.data,
        horaInicio: row.horaInicio,
        capacidade: Number(row.capacidade),
        modalidade: row.modalidade,
        diaSemana: Number(row.diaSemana)
      }));
      
      console.log(`Encontradas ${aulas.length} aulas para ${modalidade} às ${horario} de ${diaSemana}`);
      
      
      if (aulas.length === 0) {
        throw new Error("Detalhes da aula não encontrados");
      }
      
      // Obter aulas com os alunos presentes
      const aulaIds = aulas.map(a => a.id);
      
      // Calcular média de alunos - usando SQL direto para evitar problemas com tipagem
      const aulasPresencaQuery = sql`
        SELECT id, alunos_presentes as "alunosPresentes"
        FROM aulas
        WHERE id IN (${sql.join(aulaIds, sql`, `)})
      `;
      
      const aulasPresencaResult = await db.execute(aulasPresencaQuery);
      const aulasPresenca = aulasPresencaResult.rows.map(row => ({
        id: row.id,
        alunosPresentes: row.alunosPresentes
      }));
      
      // Total de alunos (soma total de todos os check-ins)
      const totalAlunos = aulasPresenca.reduce((sum, a) => sum + (Number(a.alunosPresentes || 0)), 0);
      
      // Média de alunos por aula
      const mediaAlunos = aulaIds.length > 0 ? Math.round(totalAlunos / aulaIds.length) : 0;
      
      // Capacidade total (capacidade por aula × número de aulas)
      const capacidadePorAula = Number(aulas[0].capacidade);
      const capacidadeTotal = capacidadePorAula * aulaIds.length;
      
      // Ocupação como (total de alunos / capacidade total) * 100
      const ocupacao = capacidadeTotal > 0 ? Math.round((totalAlunos / capacidadeTotal) * 100) : 0;
      
      // Obter valores fixos do sistema
      const valoresFixos = await this.getValoresFixos();
      const receitaPorAluno = parseFloat(String(valoresFixos.receitaPorAluno));
      const custoFixoPorAula = parseFloat(String(valoresFixos.custoFixoPorAula));
      
      // Total de alunos do mês (soma dos alunos presentes em todas as aulas)
      const totalAlunosMes = aulasPresenca.reduce((sum, a) => sum + Number(a.alunosPresentes || 0), 0);
      
      // Aulas reais com check-ins realizados
      const aulasComCheckin = totalAlunosMes; // Total de check-ins é igual ao total de alunos
      
      // Calcular valores financeiros reais (baseado em check-ins efetivos, não em médias)
      // Valor fixo da receita por aluno (28,00) - vindo do banco de dados
      const receitaTotal = aulasPresenca.reduce((sum, a) => {
        // Certifica-se de que estamos convertendo para número e não somando NaN ou undefined
        const alunosPresentes = Number(a.alunosPresentes || 0);
        const valorPorAula = alunosPresentes * receitaPorAluno;
        console.log(`Aula ID ${a.id}, Alunos: ${alunosPresentes}, Receita: ${valorPorAula}`);
        return sum + valorPorAula;
      }, 0);
      
      // Para cálculo da média, usamos o total de aulas, não apenas as com check-in
      const receitaMediaPorAula = receitaTotal / aulaIds.length; // Média por aula (todas as aulas)
      
      // Obter professores, cargos e patentes das aulas - usando SQL direto para evitar problemas com tipagem
      const professoresQuery = sql`
        SELECT 
          p.id as "professorId", 
          p.nome as "professorNome", 
          c.nome as "cargoNome",
          pt.nome as "patenteNome",
          c.valor_hora_aula as "valorHora",
          pt.multiplicador_por_aluno as "multiplicador"
        FROM aula_professores ap
        INNER JOIN professores p ON ap.professor_id = p.id
        INNER JOIN cargos c ON ap.cargo_id = c.id
        INNER JOIN patentes pt ON ap.patente_id = pt.id
        WHERE ap.aula_id IN (${sql.join(aulaIds, sql`, `)})
        GROUP BY 
          p.id, 
          p.nome, 
          c.nome, 
          pt.nome, 
          c.valor_hora_aula, 
          pt.multiplicador_por_aluno
      `;
      
      const professoresResult = await db.execute(professoresQuery);
      const professores = professoresResult.rows.map(row => ({
        professorId: row.professorId,
        professorNome: row.professorNome,
        cargoNome: row.cargoNome,
        patenteNome: row.patenteNome,
        valorHora: row.valorHora,
        multiplicador: row.multiplicador
      }));
      
      // Calcular custos reais baseados em check-ins efetivos, não em médias
      // 1. Custo fixo por aula - valor do banco (100,00)
      const custoFixoTotal = custoFixoPorAula * aulaIds.length;
      console.log(`Custo fixo total: ${custoFixoTotal} (${custoFixoPorAula} * ${aulaIds.length} aulas)`);
      
      // 2. Custo dos cargos - multiplicado pelo número total de aulas
      // Cada professor tem um valor de hora/aula para cada aula
      const custoCargosTotal = professores.reduce((sum, p) => {
        const valorHora = Number(p.valorHora);
        console.log(`Professor ${p.professorNome}, Cargo valor: ${valorHora}`);
        return sum + valorHora;
      }, 0) * aulaIds.length;
      
      console.log(`Custo cargos total: ${custoCargosTotal}`);
      
      // 3. Custo por aluno (patente) - baseado em check-ins reais
      let custoPatenteTotal = 0;
      aulasPresenca.forEach(aula => {
        const alunosPresentes = Number(aula.alunosPresentes || 0);
        if (alunosPresentes > 0) {
          professores.forEach(p => {
            const custoPatenteAula = alunosPresentes * Number(p.multiplicador);
            console.log(`Aula ID ${aula.id}, Alunos: ${alunosPresentes}, Professor: ${p.professorNome}, Multiplicador: ${p.multiplicador}, Custo patente: ${custoPatenteAula}`);
            custoPatenteTotal += custoPatenteAula;
          });
        }
      });
      
      console.log(`Custo patente total: ${custoPatenteTotal}`);
      
      // Custos totais e por aula
      const custoTotal = custoFixoTotal + custoCargosTotal + custoPatenteTotal;
      console.log(`Custo total: ${custoTotal} = ${custoFixoTotal} + ${custoCargosTotal} + ${custoPatenteTotal}`);
      
      const custoMedioPorAula = custoTotal / (aulaIds.length || 1); // Evitar divisão por zero
      
      // Resultado mensal é a diferença entre receita total e custo total
      const resultadoMensal = receitaTotal - custoTotal;
      
      // Obter detalhes de cada aula individual com alunos presentes
      const aulasIndividuais = await Promise.all(
        aulaIds.map(async (aulaId) => {
          const aulaPresenca = aulasPresenca.find(a => a.id === aulaId);
          const quantidadeAlunos = Number(aulaPresenca?.alunosPresentes || 0);
          const receita = quantidadeAlunos * receitaPorAluno;
          
          // Calcular custo individual para cada aula
          const custoFixoIndividual = custoFixoPorAula;
          const custoCargosIndividual = professores.reduce((sum, p) => {
            console.log(`Aula individual - Professor ${p.professorNome}, Valor hora: ${p.valorHora}`);
            return sum + Number(p.valorHora);
          }, 0);
          
          const custoPatenteIndividual = professores.reduce((sum, p) => {
            const valorPatente = quantidadeAlunos * Number(p.multiplicador);
            console.log(`Aula individual - Professor ${p.professorNome}, Alunos: ${quantidadeAlunos}, Multiplicador: ${p.multiplicador}, Custo patente: ${valorPatente}`);
            return sum + valorPatente;
          }, 0);
          
          const custoIndividual = custoFixoIndividual + custoCargosIndividual + custoPatenteIndividual;
          console.log(`Aula individual - Total: ${custoIndividual} = ${custoFixoIndividual} + ${custoCargosIndividual} + ${custoPatenteIndividual}`);
          
          const aula = aulas.find(a => a.id === aulaId);
          
          return {
            data: aula ? new Date(aula.data).toLocaleDateString('pt-BR') : '',
            alunos: quantidadeAlunos,
            receita,
            custo: custoIndividual,
            resultado: receita - custoIndividual
          };
        })
      );
      
      // Calcular valor total para cada professor
      const professoresDetalhados = professores.map(p => {
        const valorHoraAula = Number(p.valorHora);
        const multiplicadorAluno = Number(p.multiplicador);
        const valorTotal = valorHoraAula + (mediaAlunos * multiplicadorAluno);
        
        return {
          id: p.professorId,
          nome: p.professorNome,
          cargo: p.cargoNome,
          patente: p.patenteNome,
          valorHora: valorHoraAula,
          multiplicadorAluno,
          valorTotal
        };
      });
      
      return {
        info: {
          modalidade,
          diaSemana,
          horario,
          capacidade: capacidadePorAula,
          capacidadeTotal: capacidadeTotal,
          mediaAlunos,
          ocupacao,
          totalAulas: aulaIds.length,
          totalCheckins: aulasComCheckin
        },
        valores: {
          mediaReceitaPorAula: receitaMediaPorAula,
          mediaCustoPorAula: custoMedioPorAula,
          receitaMensal: receitaTotal,
          custoMensal: custoTotal,
          resultadoMensal: resultadoMensal
        },
        aulas: aulasIndividuais,
        professores: professoresDetalhados
      };
    } catch (error) {
      console.error("Erro ao obter detalhes da aula:", error);
      throw error;
    }
  },
  
  // Professores - relatórios e métricas
  async getProfessoresDestaque(mesAno: string, limit: number = 3) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter professores com mais aulas e alunos no período
      const professores = await db.select({
        id: schema.professores.id,
        nome: schema.professores.nome,
        email: schema.professores.email,
        totalAulas: count(schema.aulaProfessores.id),
        totalAlunos: sum(schema.aulas.alunosPresentes),
      })
      .from(schema.professores)
      .innerJoin(schema.aulaProfessores, eq(schema.professores.id, schema.aulaProfessores.professorId))
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .where(
        and(
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`),
          eq(schema.professores.role, 'professor'),
          gt(schema.aulas.alunosPresentes, 0)
        )
      )
      .groupBy(schema.professores.id)
      .orderBy(desc(sql`SUM(${schema.aulas.alunosPresentes})`))
      .limit(limit);
      
      // Calcular média de alunos e valor a receber para cada professor
      const professoresDetalhados = await Promise.all(
        professores.map(async (professor) => {
          // Obter cargos e patentes usados pelo professor
          const cargosPatentes = await db.select({
            cargoValor: schema.cargos.valorHoraAula,
            patenteMultiplicador: schema.patentes.multiplicadorPorAluno,
            aulaId: schema.aulaProfessores.aulaId
          })
          .from(schema.aulaProfessores)
          .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
          .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
          .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
          .where(
            and(
              eq(schema.aulaProfessores.professorId, professor.id),
              gte(schema.aulas.data, sql`${dataInicioSQL}`),
              lte(schema.aulas.data, sql`${dataFimSQL}`)
            )
          );
          
          // Obter aulas com alunos presentes
          const aulasComAlunos = await db.select({
            id: schema.aulas.id,
            alunosPresentes: schema.aulas.alunosPresentes
          })
          .from(schema.aulas)
          .where(
            and(
              gte(schema.aulas.data, sql`${dataInicioSQL}`),
              lte(schema.aulas.data, sql`${dataFimSQL}`),
              gt(schema.aulas.alunosPresentes, 0)
            )
          );
          
          // Calcular valor a receber
          let valorTotal = 0;
          
          // Para cada aula com cargo/patente
          cargosPatentes.forEach(cp => {
            // Encontrar aula correspondente
            const aula = aulasComAlunos.find(a => a.id === cp.aulaId);
            if (aula && aula.alunosPresentes > 0) {
              // Valor do cargo + (alunos × multiplicador da patente)
              valorTotal += Number(cp.cargoValor) + (Number(aula.alunosPresentes) * Number(cp.patenteMultiplicador));
            } else {
              // Se não tiver alunos presentes, só considera o valor do cargo
              valorTotal += Number(cp.cargoValor);
            }
          });
          
          // Média de alunos
          const mediaAlunos = professor.totalAlunos && professor.totalAulas 
            ? Math.round(Number(professor.totalAlunos) / Number(professor.totalAulas)) 
            : 0;
          
          return {
            id: professor.id,
            nome: professor.nome,
            email: professor.email,
            totalAulas: professor.totalAulas || 0,
            totalAlunos: professor.totalAlunos || 0,
            mediaAlunos,
            valorReceber: valorTotal
          };
        })
      );
      
      return professoresDetalhados;
    } catch (error) {
      console.error("Erro ao obter professores destaque:", error);
      return [];
    }
  },
  
  async getProfessorById(professorId: number, mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter dados básicos do professor
      const professor = await db.query.professores.findFirst({
        where: eq(schema.professores.id, professorId)
      });
      
      if (!professor) {
        return null;
      }
      
      // Obter contagem de aulas e alunos
      const metricas = await db.select({
        totalAulas: count(schema.aulaProfessores.id),
        totalAlunos: sum(schema.aulas.alunosPresentes),
      })
      .from(schema.aulaProfessores)
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professor.id),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      );
      
      const totalAulas = metricas[0]?.totalAulas || 0;
      const totalAlunos = metricas[0]?.totalAlunos || 0;
      const mediaAlunos = totalAulas > 0 ? Math.round(Number(totalAlunos) / Number(totalAulas)) : 0;
      
      // Obter cargos e patentes mais usados pelo professor no período
      const cargosPatentesMaisUsados = await db.select({
        cargo: schema.cargos.nome,
        patente: schema.patentes.nome,
        total: count()
      })
      .from(schema.aulaProfessores)
      .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
      .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professor.id),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      )
      .groupBy(schema.cargos.nome, schema.patentes.nome)
      .orderBy(desc(count()))
      .limit(1);
      
      // Extrair cargo e patente mais usados, se existirem
      const cargoMaisUsado = cargosPatentesMaisUsados.length > 0 ? cargosPatentesMaisUsados[0].cargo : null;
      const patenteMaisUsada = cargosPatentesMaisUsados.length > 0 ? cargosPatentesMaisUsados[0].patente : null;
      
      // Obter aulas com informações de ocupação
      const aulasInfo = await db.select({
        id: schema.aulas.id,
        capacidade: schema.aulas.capacidade,
        alunosPresentes: schema.aulas.alunosPresentes
      })
      .from(schema.aulas)
      .innerJoin(schema.aulaProfessores, eq(schema.aulas.id, schema.aulaProfessores.aulaId))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professor.id),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      );
      
      // Calcular ocupação
      let capacidadeTotal = 0;
      let alunosTotal = 0;
      aulasInfo.forEach(aula => {
        capacidadeTotal += Number(aula.capacidade || 0);
        alunosTotal += Number(aula.alunosPresentes || 0);
      });
      
      const ocupacao = capacidadeTotal > 0 ? (alunosTotal / capacidadeTotal) * 100 : 0;
      
      // Obter cargos e patentes usados pelo professor para cálculo financeiro
      const cargosPatentes = await db.select({
        cargoValor: schema.cargos.valorHoraAula,
        patenteMultiplicador: schema.patentes.multiplicadorPorAluno,
        aulaId: schema.aulaProfessores.aulaId
      })
      .from(schema.aulaProfessores)
      .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
      .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professor.id),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      );
      
      // Obter aulas com alunos presentes
      const aulasComAlunos = await db.select({
        id: schema.aulas.id,
        alunosPresentes: schema.aulas.alunosPresentes
      })
      .from(schema.aulas)
      .where(
        and(
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      );
      
      // Calcular valores de cargo e patente separadamente
      let valorTotalCargo = 0;
      let valorTotalPatente = 0;
      let valorReceber = 0;
      
      // Para cada aula com cargo/patente
      cargosPatentes.forEach(cp => {
        // Encontrar aula correspondente
        const aula = aulasComAlunos.find(a => a.id === cp.aulaId);
        const valorCargo = Number(cp.cargoValor);
        let valorPatente = 0;
        
        if (aula && aula.alunosPresentes > 0) {
          // Calcular valor da patente (alunos × multiplicador)
          valorPatente = Number(aula.alunosPresentes) * Number(cp.patenteMultiplicador);
          // Valor total = cargo + patente
          valorReceber += valorCargo + valorPatente;
        } else {
          // Se não tiver alunos presentes, só considera o valor do cargo
          valorReceber += valorCargo;
        }
        
        // Acumular os valores separadamente
        valorTotalCargo += valorCargo;
        valorTotalPatente += valorPatente;
      });
      
      return {
        id: professor.id,
        nome: professor.nome,
        email: professor.email,
        cargo: cargoMaisUsado,  // Retorna o cargo mais usado
        patente: patenteMaisUsada,  // Retorna a patente mais usada
        totalAulas,
        totalAlunos,
        totalPresencas: totalAlunos, // Para compatibilidade na interface
        mediaAlunos,
        valorReceber,
        valorCargo: valorTotalCargo, // Valor total dos cargos
        valorPatente: valorTotalPatente, // Valor total das patentes
        ocupacao  // Incluindo a ocupação média
      };
    } catch (error) {
      console.error("Erro ao obter dados do professor:", error);
      return null;
    }
  },
  
  async getProfessorAulas(professorId: number, mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter aulas do professor com cargo, patente e modalidade
      const aulas = await db.select({
        aulaId: schema.aulas.id,
        data: schema.aulas.data,
        horaInicio: schema.aulas.horaInicio,
        alunosPresentes: schema.aulas.alunosPresentes,
        capacidade: schema.aulas.capacidade, // Adicionado capacidade aqui
        modalidade: schema.modalidades.nome,
        cargo: schema.cargos.nome,
        patente: schema.patentes.nome,
        valorHora: schema.cargos.valorHoraAula,
        multiplicadorAluno: schema.patentes.multiplicadorPorAluno
      })
      .from(schema.aulaProfessores)
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .innerJoin(schema.modalidades, eq(schema.aulas.modalidadeId, schema.modalidades.id))
      .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
      .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professorId),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      )
      .orderBy(schema.aulas.data, schema.aulas.horaInicio);
      
      // Montar resultado final
      const aulasDetalhadas = aulas.map(aula => {
        const quantidadeAlunos = aula.alunosPresentes || 0;
        
        // Calcular valor total
        const valorHora = Number(aula.valorHora);
        const multiplicador = Number(aula.multiplicadorAluno);
        const valorTotal = valorHora + (Number(quantidadeAlunos) * multiplicador);
        
        // Formatação segura de data
        let dataFormatada = '';
        try {
          const dataStr = String(aula.data || '');
          
          // Verificar se já está em formato brasileiro (DD/MM/YYYY)
          if (dataStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            dataFormatada = dataStr;
          } else if (aula.data instanceof Date) {
            // Se já for um objeto Date
            dataFormatada = aula.data.toLocaleDateString('pt-BR');
          } else {
            // Tenta converter para Date e formatar
            try {
              const dataObj = new Date(dataStr);
              if (!isNaN(dataObj.getTime())) {
                dataFormatada = dataObj.toLocaleDateString('pt-BR');
              } else {
                // Caso falhe, tenta formatar manualmente usando valores do ISO (ano-mes-dia)
                const dataParts = dataStr.split('-');
                if (dataParts.length === 3) {
                  // Formato ISO: YYYY-MM-DD
                  const dia = dataParts[2].substring(0, 2);
                  const mes = dataParts[1];
                  const ano = dataParts[0];
                  dataFormatada = `${dia}/${mes}/${ano}`;
                } else {
                  dataFormatada = dataStr;
                }
              }
            } catch (e) {
              dataFormatada = dataStr;
            }
          }
        } catch (e) {
          console.error("Erro ao formatar data:", e);
          dataFormatada = String(aula.data || '');
        }
        
        return {
          id: aula.aulaId,
          data: dataFormatada,
          horaInicio: aula.horaInicio,
          modalidade: aula.modalidade,
          cargo: aula.cargo,
          patente: aula.patente,
          valorHora,
          multiplicadorAluno: multiplicador,
          quantidadeAlunos,
          valorTotal,
          capacidade: Number(aula.capacidade || 0)
        };
      });
      
      return aulasDetalhadas;
    } catch (error) {
      console.error("Erro ao obter aulas do professor:", error);
      return [];
    }
  },
  
  // Funções para os registros financeiros
  async getFinanceiros(aulaId?: number) {
    try {
      if (aulaId) {
        return await db.query.financeiros.findMany({
          where: eq(schema.financeiros.aulaId, aulaId),
          with: {
            aula: {
              with: {
                modalidade: true
              }
            }
          }
        });
      } else {
        return await db.query.financeiros.findMany({
          with: {
            aula: {
              with: {
                modalidade: true
              }
            }
          },
          orderBy: [desc(schema.financeiros.createdAt)]
        });
      }
    } catch (error) {
      console.error("Erro ao obter registros financeiros:", error);
      return [];
    }
  },
  
  async criarFinanceiro(data: schema.FinanceiroInsert) {
    try {
      return await db.insert(schema.financeiros)
        .values(data)
        .returning();
    } catch (error) {
      console.error("Erro ao criar registro financeiro:", error);
      throw error;
    }
  },
  
  async atualizarFinanceiro(id: number, data: Partial<schema.FinanceiroInsert>) {
    try {
      return await db.update(schema.financeiros)
        .set(data)
        .where(eq(schema.financeiros.id, id))
        .returning();
    } catch (error) {
      console.error("Erro ao atualizar registro financeiro:", error);
      throw error;
    }
  },
  
  async deletarFinanceiro(id: number) {
    try {
      return await db.delete(schema.financeiros)
        .where(eq(schema.financeiros.id, id))
        .returning();
    } catch (error) {
      console.error("Erro ao deletar registro financeiro:", error);
      throw error;
    }
  },
  
  // Funções para meritocracia
  async getProfessoresMeritocracia(mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter todos os professores
      const professores = await db.query.professores.findMany({
        where: eq(schema.professores.role, "professor")
      });
      
      // Para cada professor, calcular métricas de meritocracia
      const resultado = await Promise.all(
        professores.map(async (professor) => {
          // Obter cargo e patente mais usados pelo professor no período
          const cargosPatentesMaisUsados = await db.select({
            cargo: schema.cargos.nome,
            patente: schema.patentes.nome,
            total: count()
          })
          .from(schema.aulaProfessores)
          .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
          .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
          .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
          .where(
            and(
              eq(schema.aulaProfessores.professorId, professor.id),
              gte(schema.aulas.data, sql`${dataInicioSQL}`),
              lte(schema.aulas.data, sql`${dataFimSQL}`)
            )
          )
          .groupBy(schema.cargos.nome, schema.patentes.nome)
          .orderBy(desc(count()))
          .limit(1);
          
          // Extrair cargo e patente mais usados, se existirem
          const cargoMaisUsado = cargosPatentesMaisUsados.length > 0 ? cargosPatentesMaisUsados[0].cargo : null;
          const patenteMaisUsada = cargosPatentesMaisUsados.length > 0 ? cargosPatentesMaisUsados[0].patente : null;
          
          // Obter contagem de aulas e alunos
          const metricas = await db.select({
            totalAulas: count(schema.aulaProfessores.id),
            totalAlunos: sum(schema.aulas.alunosPresentes),
          })
          .from(schema.aulaProfessores)
          .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
          .where(
            and(
              eq(schema.aulaProfessores.professorId, professor.id),
              gte(schema.aulas.data, sql`${dataInicioSQL}`),
              lte(schema.aulas.data, sql`${dataFimSQL}`)
            )
          );
          
          const totalAulas = metricas[0]?.totalAulas || 0;
          const totalAlunos = metricas[0]?.totalAlunos || 0;
          
          // Obter informações de capacidade para cálculo de ocupação
          const aulasCapacidade = await db.select({
            id: schema.aulas.id,
            capacidade: schema.aulas.capacidade,
            alunosPresentes: schema.aulas.alunosPresentes
          })
          .from(schema.aulas)
          .innerJoin(schema.aulaProfessores, eq(schema.aulas.id, schema.aulaProfessores.aulaId))
          .where(
            and(
              eq(schema.aulaProfessores.professorId, professor.id),
              gte(schema.aulas.data, sql`${dataInicioSQL}`),
              lte(schema.aulas.data, sql`${dataFimSQL}`)
            )
          );
          
          // Cálculo de ocupação
          let capacidadeTotal = 0;
          let alunosTotal = 0;
          
          aulasCapacidade.forEach(aula => {
            capacidadeTotal += Number(aula.capacidade || 0);
            alunosTotal += Number(aula.alunosPresentes || 0);
          });
          
          const ocupacao = capacidadeTotal > 0 ? (alunosTotal / capacidadeTotal) * 100 : 0;
          
          // Calcular valor de meritocracia (quanto o professor vai receber)
          const valores = await this.calcularValorMeritocracia(professor.id, mesAno);
          
          // Construir objeto de resultado com todas as informações necessárias
          return {
            id: professor.id,
            nome: professor.nome,
            email: professor.email,
            cargo: cargoMaisUsado,
            patente: patenteMaisUsada,
            totalAulas,
            totalAlunos,
            totalPresencas: totalAlunos, // Alias para compatibilidade com a interface
            mediaAlunos: totalAulas > 0 ? totalAlunos / totalAulas : 0, // Média de alunos por aula
            ocupacao, // Taxa de ocupação
            valorMeritocracia: valores.valorPatente, // Valor apenas da meritocracia (patente)
            valorCargo: valores.valorCargo, // Valor apenas do cargo
            valorPatente: valores.valorPatente, // Alias para o valorMeritocracia
            totalGanhos: valores.total // Total (cargo + patente)
          };
        })
      );
      
      // Ordenar por valor de meritocracia (decrescente)
      return resultado.sort((a, b) => Number(b.totalGanhos) - Number(a.totalGanhos));
      
    } catch (error) {
      console.error("Erro ao obter dados de meritocracia:", error);
      return [];
    }
  },
  
  async getProfessorMeritocracia(professorId: number, mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter dados básicos do professor
      const professor = await db.query.professores.findFirst({
        where: eq(schema.professores.id, professorId)
      });
      
      if (!professor) {
        return null;
      }
      
      // Obter contagem de aulas e alunos diretamente via SQL
      const metricasQuery = sql`
        SELECT 
          COUNT(ap.id) as total_aulas, 
          SUM(a.alunos_presentes) as total_alunos
        FROM aula_professores ap
        JOIN aulas a ON ap.aula_id = a.id
        WHERE ap.professor_id = ${professor.id}
          AND a.data >= ${dataInicioSQL}
          AND a.data <= ${dataFimSQL}
      `;
      
      const metricasResult = await db.execute(metricasQuery);
      const totalAulas = Number(metricasResult.rows[0]?.total_aulas || 0);
      const totalAlunos = Number(metricasResult.rows[0]?.total_alunos || 0);
      
      // Obter detalhes das aulas com formatação de data diretamente no SQL
      const aulasQuery = sql`
        SELECT 
          a.id as aula_id,
          TO_CHAR(a.data, 'DD/MM/YYYY') as data,
          a.hora_inicio,
          a.capacidade,
          a.alunos_presentes,
          m.nome as modalidade,
          c.nome as cargo,
          p.nome as patente,
          p.multiplicador_por_aluno
        FROM aula_professores ap
        JOIN aulas a ON ap.aula_id = a.id
        JOIN modalidades m ON a.modalidade_id = m.id
        JOIN cargos c ON ap.cargo_id = c.id
        JOIN patentes p ON ap.patente_id = p.id
        WHERE ap.professor_id = ${professor.id}
          AND a.data >= ${dataInicioSQL}
          AND a.data <= ${dataFimSQL}
        ORDER BY a.data, a.hora_inicio
      `;
      
      const aulasResult = await db.execute(aulasQuery);
      
      // Calcular valor total da meritocracia
      const valores = await this.calcularValorMeritocracia(professor.id, mesAno);
      
      // Processar detalhes das aulas para incluir valor por aula
      const aulasComValores = aulasResult.rows.map((row: any) => {
        const quantidadeAlunos = Number(row.alunos_presentes || 0);
        const multiplicador = Number(row.multiplicador_por_aluno || 0);
        const valorAula = quantidadeAlunos * multiplicador;
        
        return {
          id: row.aula_id,
          data: row.data, // Já formatado pelo SQL como DD/MM/YYYY
          horaInicio: row.hora_inicio,
          modalidade: row.modalidade,
          cargo: row.cargo,
          patente: row.patente,
          capacidade: Number(row.capacidade || 0),
          alunosPresentes: quantidadeAlunos,
          multiplicador,
          valorAula
        };
      });
      
      return {
        id: professor.id,
        nome: professor.nome,
        email: professor.email,
        totalAulas,
        totalAlunos,
        valorCargo: valores.valorCargo,
        valorPatente: valores.valorPatente,
        totalGanhos: valores.total,
        mesAno: `${mes}/${ano}`,
        aulas: aulasComValores
      };
      
    } catch (error) {
      console.error("Erro ao obter dados de meritocracia do professor:", error);
      return null;
    }
  },
  
  async calcularValorMeritocracia(professorId: number, mesAno: string) {
    try {
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Obter todas as aulas do professor no período com todos os dados necessários
      const aulasCompletas = await db.select({
        aulaId: schema.aulas.id,
        alunosPresentes: schema.aulas.alunosPresentes,
        multiplicador: schema.patentes.multiplicadorPorAluno,
        valorHora: schema.cargos.valorHoraAula
      })
      .from(schema.aulaProfessores)
      .innerJoin(schema.aulas, eq(schema.aulaProfessores.aulaId, schema.aulas.id))
      .innerJoin(schema.patentes, eq(schema.aulaProfessores.patenteId, schema.patentes.id))
      .innerJoin(schema.cargos, eq(schema.aulaProfessores.cargoId, schema.cargos.id))
      .where(
        and(
          eq(schema.aulaProfessores.professorId, professorId),
          gte(schema.aulas.data, sql`${dataInicioSQL}`),
          lte(schema.aulas.data, sql`${dataFimSQL}`)
        )
      );
      
      // Calcular valor patente (valor da meritocracia - multiplicador * alunos)
      let valorPatente = 0;
      // Calcular valor do cargo (valor da hora aula)
      let valorCargo = 0;
      
      for (const aula of aulasCompletas) {
        const alunosPresentes = Number(aula.alunosPresentes || 0);
        const multiplicador = Number(aula.multiplicador || 0);
        valorPatente += alunosPresentes * multiplicador;
        
        // Adicionar valor hora aula
        valorCargo += Number(aula.valorHora || 0);
      }
      
      return {
        valorPatente,
        valorCargo,
        total: valorPatente + valorCargo
      };
      
    } catch (error) {
      console.error("Erro ao calcular valor de meritocracia:", error);
      return {
        valorPatente: 0,
        valorCargo: 0,
        total: 0
      };
    }
  },

  // ===== Funções para redefinição de senha =====
  
  async createPasswordResetToken(userId: number): Promise<schema.PasswordResetToken> {
    try {
      // Gerar token aleatório
      const tokenLength = 64;
      const token = crypto.randomBytes(tokenLength).toString('hex');
      
      // Definir data de expiração (24 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Criar token no banco de dados
      const [createdToken] = await db.insert(schema.passwordResetTokens)
        .values({
          userId,
          token,
          expiresAt,
          used: 'false',
        })
        .returning();
      
      return createdToken;
    } catch (error) {
      console.error("Erro ao criar token de redefinição de senha:", error);
      throw error;
    }
  },
  
  async getPasswordResetToken(token: string): Promise<schema.PasswordResetToken | null> {
    try {
      const result = await db.query.passwordResetTokens.findFirst({
        where: (tokens, { eq, and }) => and(
          eq(tokens.token, token),
          eq(tokens.used, 'false')
        )
      });
      
      return result || null;
    } catch (error) {
      console.error("Erro ao buscar token de redefinição de senha:", error);
      return null;
    }
  },
  
  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: number; tokenId?: number }> {
    try {
      const resetToken = await this.getPasswordResetToken(token);
      
      if (!resetToken) {
        return { valid: false };
      }
      
      // Verificar se o token expirou
      const now = new Date();
      if (new Date(resetToken.expiresAt) < now) {
        return { valid: false };
      }
      
      return { 
        valid: true, 
        userId: resetToken.userId,
        tokenId: resetToken.id
      };
    } catch (error) {
      console.error("Erro ao validar token de redefinição de senha:", error);
      return { valid: false };
    }
  },
  
  async markTokenAsUsed(tokenId: number): Promise<void> {
    try {
      await db.update(schema.passwordResetTokens)
        .set({ used: 'true' })
        .where(eq(schema.passwordResetTokens.id, tokenId));
    } catch (error) {
      console.error("Erro ao marcar token como usado:", error);
      throw error;
    }
  },
  
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Hash da nova senha
      const senhaHash = await bcrypt.hash(newPassword, 10);
      
      // Atualizar senha no banco
      await db.update(schema.professores)
        .set({ senhaHash })
        .where(eq(schema.professores.id, userId));
      
      return true;
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return false;
    }
  },

  // ===== Função para análise de aulas com lucro e prejuízo =====
  
  async getAulasLucroEPrejuizo(mesAno: string) {
    try {
      console.log(`Consultando aulas para mês/ano: ${mesAno}`);
      
      // Processar mesAno no formato "MM/YYYY"
      const [mes, ano] = mesAno.split('/').map(Number);
      
      // Calcular primeiro e último dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      
      // Formatação para consulta SQL
      const dataInicioSQL = dataInicio.toISOString().split('T')[0];
      const dataFimSQL = dataFim.toISOString().split('T')[0];
      
      // Consultar total de todas as aulas no período
      const countTodasAulas = await db.execute(sql`
        SELECT 
          COUNT(*) as total
        FROM aulas a
        WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
      `);
      
      const totalTodasAulas = parseInt(countTodasAulas.rows[0]?.total || '0');
      
      // Consultar total de aulas com check-in
      const countAulasCheckIn = await db.execute(sql`
        SELECT 
          COUNT(*) as total
        FROM aulas a
        WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
          AND a.alunos_presentes > 0
      `);
      
      const totalAulasCheckIn = parseInt(countAulasCheckIn.rows[0]?.total || '0');
      const aulasSemCheckIn = totalTodasAulas - totalAulasCheckIn;
      
      console.log(`Total de aulas no período: ${totalTodasAulas}`);
      console.log(`Total de aulas com check-in: ${totalAulasCheckIn}`);
      console.log(`Aulas sem check-in: ${aulasSemCheckIn}`);
      
      if (totalAulasCheckIn === 0) {
        console.log("Não foram encontradas aulas com check-in, retornando zeros");
        return {
          aulasComLucro: 0,
          aulasComPrejuizo: 0,
          aulasSemCheckIn: totalTodasAulas,
          totalAulas: totalTodasAulas
        };
      }
      
      // Usando os nomes corretos das colunas conforme definido no schema.ts
      const aulasLucrativas = await db.execute(sql`
        WITH aula_resultado AS (
          SELECT 
            a.id,
            (a.alunos_presentes * 28.00) - (78.00 + COALESCE(
              (SELECT SUM(c.valor_hora_aula) 
               FROM aula_professores ap 
               JOIN cargos c ON ap.cargo_id = c.id 
               WHERE ap.aula_id = a.id), 0
            ) + COALESCE(
              (SELECT SUM(a.alunos_presentes * p.multiplicador_por_aluno) 
               FROM aula_professores ap 
               JOIN patentes p ON ap.patente_id = p.id 
               WHERE ap.aula_id = a.id), 0
            )) AS resultado
          FROM aulas a
          WHERE a.data BETWEEN ${dataInicioSQL} AND ${dataFimSQL}
            AND a.alunos_presentes > 0
        )
        SELECT 
          COUNT(*) FILTER (WHERE resultado >= 0) as lucro,
          COUNT(*) FILTER (WHERE resultado < 0) as prejuizo
        FROM aula_resultado
      `);
      
      const aulasComLucro = parseInt(aulasLucrativas.rows[0]?.lucro || '0');
      const aulasComPrejuizo = parseInt(aulasLucrativas.rows[0]?.prejuizo || '0');
      
      console.log(`Resultado da análise: ${aulasComLucro} aulas com lucro, ${aulasComPrejuizo} aulas com prejuízo, ${aulasSemCheckIn} aulas sem check-in`);
      
      return {
        aulasComLucro,
        aulasComPrejuizo,
        aulasSemCheckIn,
        totalAulas: totalTodasAulas
      };
    } catch (error) {
      console.error("Erro ao calcular aulas com lucro e prejuízo:", error);
      
      return {
        aulasComLucro: 0,
        aulasComPrejuizo: 0,
        aulasSemCheckIn: 0,
        totalAulas: 0
      };
    }
  }
};