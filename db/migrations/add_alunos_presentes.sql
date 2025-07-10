-- Migração para adicionar a coluna alunos_presentes na tabela aulas
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS alunos_presentes INTEGER NOT NULL DEFAULT 0;

-- Para cada aula, transferir os dados da tabela checkins para a coluna alunos_presentes
UPDATE aulas 
SET alunos_presentes = c.quantidade_alunos
FROM checkins c
WHERE aulas.id = c.aula_id;

-- Tabela checkins não será removida para preservar dados históricos
-- mas futuros registros usarão apenas a tabela aulas