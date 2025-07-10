import { relations } from "drizzle-orm/relations";
import { aulas, checkins, professores, modalidades, aulaProfessores, cargos, patentes } from "./schema";

export const checkinsRelations = relations(checkins, ({one}) => ({
	aula: one(aulas, {
		fields: [checkins.aulaId],
		references: [aulas.id]
	}),
	professore: one(professores, {
		fields: [checkins.professorId],
		references: [professores.id]
	}),
}));

export const aulasRelations = relations(aulas, ({one, many}) => ({
	checkins: many(checkins),
	modalidade: one(modalidades, {
		fields: [aulas.modalidadeId],
		references: [modalidades.id]
	}),
	aulaProfessores: many(aulaProfessores),
}));

export const professoresRelations = relations(professores, ({many}) => ({
	checkins: many(checkins),
	aulaProfessores: many(aulaProfessores),
}));

export const modalidadesRelations = relations(modalidades, ({many}) => ({
	aulas: many(aulas),
}));

export const aulaProfessoresRelations = relations(aulaProfessores, ({one}) => ({
	aula: one(aulas, {
		fields: [aulaProfessores.aulaId],
		references: [aulas.id]
	}),
	professore: one(professores, {
		fields: [aulaProfessores.professorId],
		references: [professores.id]
	}),
	cargo: one(cargos, {
		fields: [aulaProfessores.cargoId],
		references: [cargos.id]
	}),
	patente: one(patentes, {
		fields: [aulaProfessores.patenteId],
		references: [patentes.id]
	}),
}));

export const cargosRelations = relations(cargos, ({many}) => ({
	aulaProfessores: many(aulaProfessores),
}));

export const patentesRelations = relations(patentes, ({many}) => ({
	aulaProfessores: many(aulaProfessores),
}));