import { Resend } from 'resend';

// Verifica se a API key está definida
if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY não está definida. O envio de emails não funcionará corretamente.");
} else {
  console.log("RESEND_API_KEY está definida. Comprimento da chave:", process.env.RESEND_API_KEY.length);
}

const apiKey = process.env.RESEND_API_KEY || '';
console.log("Inicializando Resend com API key definida:", !!apiKey);
const resend = new Resend(apiKey);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Serviço para enviar emails usando a Resend
 */
export const emailService = {
  /**
   * Envia um email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Email padrão de origem usando o domínio resend.dev (que é permitido por padrão)
      const fromEmail = options.from || "CF98 <onboarding@resend.dev>";
      
      console.log("Tentando enviar email para:", options.to);
      console.log("De:", fromEmail);
      console.log("Assunto:", options.subject);
      
      // Envia o email
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      
      if (error) {
        console.error("Erro ao enviar email:", error);
        return false;
      }
      
      console.log("Email enviado com sucesso:", data);
      return true;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      return false;
    }
  },
  
  /**
   * Envia um email de redefinição de senha
   */
  async sendPasswordResetEmail(email: string, nome: string, resetToken: string, resetUrl: string): Promise<boolean> {
    const subject = "Redefinição de Senha - CF98";
    
    // Template do email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://cf98.app.br/logo.png" alt="CF98 Logo" style="max-width: 150px;">
        </div>
        
        <h2 style="color: #ff6600; text-align: center;">Recuperação de Senha</h2>
        
        <p>Olá ${nome},</p>
        
        <p>Recebemos uma solicitação para redefinir sua senha. Se você não solicitou uma redefinição de senha, ignore este email.</p>
        
        <p>Para redefinir sua senha, clique no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        
        <p>Ou copie e cole o seguinte link em seu navegador:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        
        <p>Este link expirará em 24 horas.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
          <p>Este é um email automático, por favor não responda.</p>
          <p>&copy; ${new Date().getFullYear()} CF98 - Todos os direitos reservados.</p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }
};