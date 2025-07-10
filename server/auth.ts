import { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage';
import PgSession from 'connect-pg-simple';
import { pool } from '@db';

export function configureAuth(app: Express) {
  // Configurar sessão
  const PgSessionStore = PgSession(session);
  
  app.use(
    session({
      store: new PgSessionStore({
        pool,
        tableName: 'session', // Tabela criada automaticamente
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'sistema-meritocracia-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
        secure: false, // Alterado de process.env.NODE_ENV === 'production' para false sempre
        httpOnly: true
      }
    })
  );

  // Inicializar Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log("Autenticação configurada e inicializada");

  // Configurar LocalStrategy (email e senha)
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'senha'
      },
      async (email, senha, done) => {
        try {
          // Buscar usuário pelo email
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: 'Email não encontrado' });
          }
          
          // Verificar senha
          const isPasswordValid = await storage.verifyPassword(senha, user.senhaHash);
          
          if (!isPasswordValid) {
            return done(null, false, { message: 'Senha incorreta' });
          }
          
          // Login bem-sucedido
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configurar serialização/desserialização de usuário
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
