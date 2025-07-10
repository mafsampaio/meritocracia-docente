# Sistema de Gestão de Meritocracia

Aplicação web em português para gerenciamento de meritocracia docente, com foco em análise financeira detalhada e avaliação de desempenho para instituições educacionais.

## 🚀 Características Principais

- **Interface Responsiva**: Design moderno com tema escuro/claro adaptável
- **Dashboard Financeiro**: Cards dinâmicos de lucro, prejuízo e total de aulas
- **Análise de Professores**: Visualização detalhada de desempenho e meritocracia
- **Gestão de Aulas**: Sistema completo de agendamento e check-in
- **Relatórios em PDF**: Geração automática de relatórios de meritocracia
- **Sistema de Autenticação**: Login seguro com recuperação de senha

## 🛠 Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **TypeScript** para tipagem
- **Drizzle ORM** para banco de dados
- **PostgreSQL** como banco de dados
- **Passport.js** para autenticação
- **Resend** para envio de emails
- **jsPDF** para geração de relatórios

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd sistema-gestao-meritocracia
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `SESSION_SECRET`: Chave secreta para sessões
- `RESEND_API_KEY`: Chave da API do Resend (para emails)

4. **Configure o banco de dados**
```bash
npm run db:push
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 📊 Funcionalidades

### Dashboard Financeiro
- Métricas de receita, custos e lucro por período
- Análise de ocupação de aulas
- Gráficos interativos de desempenho
- Filtros por modalidade e professor

### Gestão de Professores
- Cadastro completo com cargos e patentes
- Sistema de meritocracia baseado em desempenho
- Relatórios individuais em PDF
- Análise de produtividade

### Agendamento de Aulas
- Interface visual de calendário
- Gestão de modalidades e horários
- Sistema de check-in para presença
- Controle de capacidade por aula

### Sistema de Autenticação
- Login seguro com validação
- Recuperação de senha por email
- Diferentes níveis de acesso (admin/professor)
- Sessões persistentes

## 🗃 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   └── hooks/         # Hooks customizados
├── server/                # Backend Express
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Funções do banco de dados
│   ├── auth.ts           # Configuração de autenticação
│   └── email.ts          # Serviços de email
├── db/                    # Configurações do banco
│   ├── migrations/        # Schemas e relacionamentos
│   └── seed.ts           # Dados iniciais
└── shared/               # Tipos e schemas compartilhados
```

## 🔧 Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run db:push`: Aplica mudanças no schema do banco
- `npm run db:seed`: Popula banco com dados iniciais
- `npm run db:studio`: Abre interface visual do banco

## 🌐 Deploy

Para deploy em produção:

1. **Configure as variáveis de ambiente de produção**
2. **Execute o build**
```bash
npm run build
```
3. **Configure o banco de dados de produção**
```bash
npm run db:push
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 🆘 Suporte

Para dúvidas ou problemas, abra uma issue no repositório ou entre em contato.