import { pgTable, unique, serial, text, numeric, timestamp, foreignKey, integer, index, varchar, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const cargos = pgTable("cargos", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	valorHoraAula: numeric("valor_hora_aula", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cargosNomeUnique: unique("cargos_nome_unique").on(table.nome),
	}
});

export const checkins = pgTable("checkins", {
	id: serial().primaryKey().notNull(),
	aulaId: integer("aula_id").notNull(),
	professorId: integer("professor_id").notNull(),
	quantidadeAlunos: integer("quantidade_alunos").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		checkinsAulaIdAulasIdFk: foreignKey({
			columns: [table.aulaId],
			foreignColumns: [aulas.id],
			name: "checkins_aula_id_aulas_id_fk"
		}),
		checkinsProfessorIdProfessoresIdFk: foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "checkins_professor_id_professores_id_fk"
		}),
	}
});

export const aulas = pgTable("aulas", {
	id: serial().primaryKey().notNull(),
	data: timestamp({ mode: 'string' }).notNull(),
	horaInicio: text("hora_inicio").notNull(),
	capacidade: integer().notNull(),
	modalidadeId: integer("modalidade_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		aulasModalidadeIdModalidadesIdFk: foreignKey({
			columns: [table.modalidadeId],
			foreignColumns: [modalidades.id],
			name: "aulas_modalidade_id_modalidades_id_fk"
		}),
	}
});

export const aulaProfessores = pgTable("aula_professores", {
	id: serial().primaryKey().notNull(),
	aulaId: integer("aula_id").notNull(),
	professorId: integer("professor_id").notNull(),
	cargoId: integer("cargo_id").notNull(),
	patenteId: integer("patente_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		aulaProfessoresAulaIdAulasIdFk: foreignKey({
			columns: [table.aulaId],
			foreignColumns: [aulas.id],
			name: "aula_professores_aula_id_aulas_id_fk"
		}),
		aulaProfessoresProfessorIdProfessoresIdFk: foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "aula_professores_professor_id_professores_id_fk"
		}),
		aulaProfessoresCargoIdCargosIdFk: foreignKey({
			columns: [table.cargoId],
			foreignColumns: [cargos.id],
			name: "aula_professores_cargo_id_cargos_id_fk"
		}),
		aulaProfessoresPatenteIdPatentesIdFk: foreignKey({
			columns: [table.patenteId],
			foreignColumns: [patentes.id],
			name: "aula_professores_patente_id_patentes_id_fk"
		}),
	}
});

export const professores = pgTable("professores", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	role: text().default('professor').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		professoresEmailUnique: unique("professores_email_unique").on(table.email),
	}
});

export const patentes = pgTable("patentes", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	multiplicadorPorAluno: numeric("multiplicador_por_aluno", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		patentesNomeUnique: unique("patentes_nome_unique").on(table.nome),
	}
});

export const modalidades = pgTable("modalidades", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		modalidadesNomeUnique: unique("modalidades_nome_unique").on(table.nome),
	}
});

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => {
	return {
		idxSessionExpire: index("IDX_session_expire").using("btree", table.expire.asc().nullsLast()),
	}
});

export const valoresFixos = pgTable("valores_fixos", {
	id: serial().primaryKey().notNull(),
	receitaPorAluno: numeric("receita_por_aluno", { precision: 10, scale:  2 }).notNull(),
	custoFixoPorAula: numeric("custo_fixo_por_aula", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
