# 📋 Instruções para Subir o Código para o GitHub

## 🔧 Pré-requisitos

1. **Conta no GitHub**: Se não tiver, crie em [github.com](https://github.com)
2. **Git instalado**: Verifique executando `git --version` no terminal
3. **SSH ou HTTPS configurado** para autenticação com GitHub

## 📝 Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Configure o repositório:
   - **Repository name**: `sistema-gestao-meritocracia`
   - **Description**: `Sistema de gestão de meritocracia docente com análise financeira`
   - **Visibility**: Escolha Public ou Private
   - **NÃO** marque "Add a README file" (já temos um)
   - **NÃO** marque "Add .gitignore" (já temos um)
5. Clique em **"Create repository"**

### 2. Baixar o Código do Replit

1. **No Replit**, clique no menu "..." ao lado do nome do projeto
2. Selecione **"Download as zip"**
3. Extraia o arquivo ZIP em uma pasta no seu computador
4. Abra o terminal/prompt de comando na pasta extraída

### 3. Configurar Git Local

```bash
# Configurar seu nome e email (se ainda não configurado)
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# Navegar para a pasta do projeto
cd caminho/para/sua/pasta/sistema-gestao-meritocracia

# Inicializar repositório Git (se necessário)
git init

# Verificar status dos arquivos
git status
```

### 4. Adicionar Arquivos ao Git

```bash
# Adicionar todos os arquivos ao staging
git add .

# Fazer o primeiro commit
git commit -m "feat: implementação inicial do sistema de gestão de meritocracia

- Dashboard financeiro com métricas de lucro/prejuízo
- Sistema de análise de professores com meritocracia
- Gestão completa de aulas e check-ins
- Autenticação segura com recuperação de senha
- Interface responsiva com tema escuro/claro
- Geração de relatórios PDF"
```

### 5. Conectar com o Repositório do GitHub

```bash
# Adicionar origem remota (substitua pela URL do seu repositório)
git remote add origin https://github.com/SEU_USUARIO/sistema-gestao-meritocracia.git

# Ou usando SSH (se configurado)
git remote add origin git@github.com:SEU_USUARIO/sistema-gestao-meritocracia.git

# Verificar se a origem foi adicionada corretamente
git remote -v
```

### 6. Enviar Código para o GitHub

```bash
# Enviar código para o GitHub
git push -u origin main

# Se der erro de branch, use:
git branch -M main
git push -u origin main
```

## 🔐 Configuração de Autenticação

### Opção A: HTTPS com Token Pessoal

1. Acesse **GitHub Settings** > **Developer settings** > **Personal access tokens**
2. Clique em **"Generate new token (classic)"**
3. Selecione as permissões necessárias:
   - `repo` (acesso completo aos repositórios)
4. Use o token como senha quando solicitado

### Opção B: SSH (Recomendado)

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu.email@exemplo.com"

# Adicionar chave ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub
```

1. Copie a saída do comando acima
2. No GitHub: **Settings** > **SSH and GPG keys** > **New SSH key**
3. Cole a chave e salve

## 📂 Estrutura de Branches (Opcional)

Para projetos maiores, considere usar branches:

```bash
# Criar branch de desenvolvimento
git checkout -b develop

# Criar branch para features
git checkout -b feature/nova-funcionalidade

# Fazer merge quando concluído
git checkout main
git merge feature/nova-funcionalidade
```

## 🚀 Próximos Passos

Após subir o código:

1. **Configure GitHub Actions** para CI/CD (se necessário)
2. **Adicione colaboradores** se for um projeto em equipe
3. **Configure Issues e Projects** para gerenciamento
4. **Adicione badges** ao README (builds, coverage, etc.)

## 🆘 Problemas Comuns

### Erro de Autenticação
- Verifique se o token/SSH está configurado corretamente
- Teste a conexão: `ssh -T git@github.com`

### Arquivos Grandes
- Use Git LFS para arquivos > 100MB
- Verifique o .gitignore para excluir node_modules

### Conflitos de Branch
```bash
git pull origin main --rebase
# Resolver conflitos manualmente
git add .
git rebase --continue
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique a [documentação oficial do Git](https://git-scm.com/docs)
2. Consulte os [guias do GitHub](https://guides.github.com/)
3. Use o comando `git help <comando>` para ajuda específica