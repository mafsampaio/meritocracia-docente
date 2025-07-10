-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "cargos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"valor_hora_aula" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cargos_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"aula_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"quantidade_alunos" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" timestamp NOT NULL,
	"hora_inicio" text NOT NULL,
	"capacidade" integer NOT NULL,
	"modalidade_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aula_professores" (
	"id" serial PRIMARY KEY NOT NULL,
	"aula_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"cargo_id" integer NOT NULL,
	"patente_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"role" text DEFAULT 'professor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "professores_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patentes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"multiplicador_por_aluno" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patentes_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modalidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modalidades_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "valores_fixos" (
	"id" serial PRIMARY KEY NOT NULL,
	"receita_por_aluno" numeric(10, 2) NOT NULL,
	"custo_fixo_por_aula" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checkins" ADD CONSTRAINT "checkins_aula_id_aulas_id_fk" FOREIGN KEY ("aula_id") REFERENCES "public"."aulas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checkins" ADD CONSTRAINT "checkins_professor_id_professores_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aulas" ADD CONSTRAINT "aulas_modalidade_id_modalidades_id_fk" FOREIGN KEY ("modalidade_id") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aula_professores" ADD CONSTRAINT "aula_professores_aula_id_aulas_id_fk" FOREIGN KEY ("aula_id") REFERENCES "public"."aulas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aula_professores" ADD CONSTRAINT "aula_professores_professor_id_professores_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aula_professores" ADD CONSTRAINT "aula_professores_cargo_id_cargos_id_fk" FOREIGN KEY ("cargo_id") REFERENCES "public"."cargos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aula_professores" ADD CONSTRAINT "aula_professores_patente_id_patentes_id_fk" FOREIGN KEY ("patente_id") REFERENCES "public"."patentes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" USING btree ("expire");
*/