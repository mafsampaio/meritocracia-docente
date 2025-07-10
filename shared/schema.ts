import { pgTable, text, serial, integer, timestamp, decimal, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Professores
export const professores = pgTable('professores', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email'), // Removemos a constraint unique para permitir vários professores sem email
  senhaHash: text('senha_hash').notNull(),
  role: text('role').notNull().default('professor'), // 'admin' ou 'professor'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Cargos (ex: Professor, Estagiário)
export const cargos = pgTable('cargos', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  valorHoraAula: decimal('valor_hora_aula', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Patentes (ex: Major, Capitão)
export const patentes = pgTable('patentes', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  multiplicadorPorAluno: decimal('multiplicador_por_aluno', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Modalidades (ex: Pilates, Yoga)
export const modalidades = pgTable('modalidades', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Aulas
export const aulas = pgTable('aulas', {
  id: serial('id').primaryKey(),
  data: timestamp('data').notNull(),
  horaInicio: text('hora_inicio').notNull(), // formato HH:MM
  capacidade: integer('capacidade').notNull(),
  alunosPresentes: integer('alunos_presentes').default(0).notNull(),
  modalidadeId: integer('modalidade_id').references(() => modalidades.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relação AulaProfessor (com cargo e patente)
export const aulaProfessores = pgTable('aula_professores', {
  id: serial('id').primaryKey(),
  aulaId: integer('aula_id').references(() => aulas.id).notNull(),
  professorId: integer('professor_id').references(() => professores.id).notNull(),
  cargoId: integer('cargo_id').references(() => cargos.id).notNull(),
  patenteId: integer('patente_id').references(() => patentes.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Removemos a tabela de checkins e adicionamos a coluna alunosPresentes diretamente na tabela aulas

// Relações
export const professoresRelations = relations(professores, ({ many }) => ({
  aulaProfessores: many(aulaProfessores)
}));

export const aulasRelations = relations(aulas, ({ one, many }) => ({
  modalidade: one(modalidades, {
    fields: [aulas.modalidadeId],
    references: [modalidades.id]
  }),
  aulaProfessores: many(aulaProfessores),
  financeiros: many(financeiros)
}));

export const aulaProfessoresRelations = relations(aulaProfessores, ({ one }) => ({
  professor: one(professores, {
    fields: [aulaProfessores.professorId],
    references: [professores.id]
  }),
  aula: one(aulas, {
    fields: [aulaProfessores.aulaId],
    references: [aulas.id]
  }),
  cargo: one(cargos, {
    fields: [aulaProfessores.cargoId],
    references: [cargos.id]
  }),
  patente: one(patentes, {
    fields: [aulaProfessores.patenteId],
    references: [patentes.id]
  })
}));

// Removemos as relações de checkins

export const modalidadesRelations = relations(modalidades, ({ many }) => ({
  aulas: many(aulas)
}));

// Schemas de validação
export const professorInsertSchema = createInsertSchema(professores, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: (schema) => schema.email("Email inválido").optional() // Campo email agora é opcional
});

export const professorSelectSchema = createSelectSchema(professores);
export type Professor = z.infer<typeof professorSelectSchema>;
export type ProfessorInsert = z.infer<typeof professorInsertSchema>;

export const cargoInsertSchema = createInsertSchema(cargos, {
  nome: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres"),
  valorHoraAula: (schema) => schema.refine(val => Number(val) > 0, "Valor da hora aula deve ser positivo")
});

export const cargoSelectSchema = createSelectSchema(cargos);
export type Cargo = z.infer<typeof cargoSelectSchema>;
export type CargoInsert = z.infer<typeof cargoInsertSchema>;

export const patenteInsertSchema = createInsertSchema(patentes, {
  nome: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres"),
  multiplicadorPorAluno: (schema) => schema.refine(val => Number(val) > 0, "Multiplicador por aluno deve ser positivo")
});

export const patenteSelectSchema = createSelectSchema(patentes);
export type Patente = z.infer<typeof patenteSelectSchema>;
export type PatenteInsert = z.infer<typeof patenteInsertSchema>;

export const modalidadeInsertSchema = createInsertSchema(modalidades, {
  nome: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres")
});

export const modalidadeSelectSchema = createSelectSchema(modalidades);
export type Modalidade = z.infer<typeof modalidadeSelectSchema>;
export type ModalidadeInsert = z.infer<typeof modalidadeInsertSchema>;

export const aulaInsertSchema = createInsertSchema(aulas, {
  capacidade: (schema) => schema.refine(val => Number(val) > 0, "Capacidade deve ser positiva"),
  horaInicio: (schema) => schema.regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)")
});

export const aulaSelectSchema = createSelectSchema(aulas);
export type Aula = z.infer<typeof aulaSelectSchema>;
export type AulaInsert = z.infer<typeof aulaInsertSchema>;

export const aulaProfessorInsertSchema = createInsertSchema(aulaProfessores);
export const aulaProfessorSelectSchema = createSelectSchema(aulaProfessores);
export type AulaProfessor = z.infer<typeof aulaProfessorSelectSchema>;
export type AulaProfessorInsert = z.infer<typeof aulaProfessorInsertSchema>;

// Removemos os schemas de checkin e atualizamos o schema de aula para incluir alunosPresentes
export const aulaUpdateSchema = createInsertSchema(aulas, {
  alunosPresentes: (schema) => schema.refine(val => Number(val) >= 0, "Quantidade de alunos não pode ser negativa")
});

// Valores financeiros fixos
export const valoresFixos = pgTable('valores_fixos', {
  id: serial('id').primaryKey(),
  receitaPorAluno: decimal('receita_por_aluno', { precision: 10, scale: 2 }).notNull(),
  custoFixoPorAula: decimal('custo_fixo_por_aula', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const valoresFixosInsertSchema = createInsertSchema(valoresFixos, {
  receitaPorAluno: (schema) => schema.refine(val => Number(val) > 0, "Receita por aluno deve ser positiva"),
  custoFixoPorAula: (schema) => schema.refine(val => Number(val) >= 0, "Custo fixo não pode ser negativo")
});

export const valoresFixosSelectSchema = createSelectSchema(valoresFixos);
export type ValoresFixos = z.infer<typeof valoresFixosSelectSchema>;
export type ValoresFixosInsert = z.infer<typeof valoresFixosInsertSchema>;

// Tabela para registros financeiros por aula
export const financeiros = pgTable('financeiros', {
  id: serial('id').primaryKey(),
  aulaId: integer('aula_id').references(() => aulas.id).notNull(),
  receita: decimal('receita', { precision: 10, scale: 2 }).notNull(),
  custo: decimal('custo', { precision: 10, scale: 2 }).notNull(),
  quantidadeAlunos: integer('quantidade_alunos').notNull(),
  observacoes: text('observacoes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const financeirosRelations = relations(financeiros, ({ one }) => ({
  aula: one(aulas, { fields: [financeiros.aulaId], references: [aulas.id] })
}));

export const financeiroInsertSchema = createInsertSchema(financeiros, {
  receita: (schema) => schema.refine(val => Number(val) >= 0, "Receita não pode ser negativa"),
  custo: (schema) => schema.refine(val => Number(val) >= 0, "Custo não pode ser negativo"),
  quantidadeAlunos: (schema) => schema.refine(val => Number(val) >= 0, "Quantidade de alunos não pode ser negativa")
});

export const financeiroSelectSchema = createSelectSchema(financeiros);
export type Financeiro = z.infer<typeof financeiroSelectSchema>;
export type FinanceiroInsert = z.infer<typeof financeiroInsertSchema>;

// Esquema para login
// Tokens de recuperação de senha
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => professores.id).notNull(),
  token: text('token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: text('used').default('false').notNull(),
});

export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(professores, {
    fields: [passwordResetTokens.userId],
    references: [professores.id],
  }),
}));

export const passwordResetTokenInsertSchema = createInsertSchema(passwordResetTokens);
export const passwordResetTokenSelectSchema = createSelectSchema(passwordResetTokens);
export type PasswordResetToken = z.infer<typeof passwordResetTokenSelectSchema>;
export type PasswordResetTokenInsert = z.infer<typeof passwordResetTokenInsertSchema>;

export const loginSchema = z.object({
  // Ajustamos para permitir login com apenas nome de usuário quando o email não for obrigatório
  email: z.string().email("Email inválido"), // Mantemos validação para evitar quebrar o login atual
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

export type LoginData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
  token: z.string(),
}).refine(data => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
