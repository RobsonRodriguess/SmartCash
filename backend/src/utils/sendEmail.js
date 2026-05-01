const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia o e-mail com o código de recuperação de senha (OTP 6 dígitos).
 * @param {object} options
 * @param {string} options.to    - E-mail do destinatário
 * @param {string} options.name  - Nome do usuário
 * @param {string} options.code  - Código OTP de 6 dígitos (texto puro)
 */
const sendResetCodeEmail = async ({ to, name, code }) => {
  // Formata o código com espaços para facilitar leitura
  const codeFormatted = code.split('').join(' ');

  const mailOptions = {
    from: `"Smart Cash Monitor" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${code} — Seu código de recuperação de senha`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperação de Senha — Smart Cash Monitor</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#0d0f14;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:520px;background:#13161e;border:1px solid rgba(79,110,247,0.2);border-radius:20px;overflow:hidden;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#1c2566 0%,#2d1a5e 100%);padding:40px 40px 32px;text-align:center;">
              <!-- Logo icon -->
              <div style="width:64px;height:64px;background:linear-gradient(135deg,#4f6ef7,#a78bfa);
                border-radius:16px;margin:0 auto 18px;line-height:64px;text-align:center;font-size:32px;
                box-shadow:0 8px 32px rgba(79,110,247,0.4);">💹</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Smart Cash Monitor
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;letter-spacing:0.5px;">
                Recuperação de Senha
              </p>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <p style="margin:0 0 6px;font-size:15px;color:#94a3b8;">
                Olá, <strong style="color:#e2e8f0;">${name}</strong> 👋
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.7;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Use o código abaixo para continuar. Ele é válido por apenas <strong style="color:#f59e0b;">15 minutos</strong>.
              </p>

              <!-- ═══ OTP CODE BOX ═══ -->
              <div style="background:rgba(79,110,247,0.07);border:1px solid rgba(79,110,247,0.25);
                border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#475569;font-size:11px;text-transform:uppercase;
                  letter-spacing:3px;font-weight:600;">Código de recuperação</p>
                <div style="font-size:40px;font-weight:800;letter-spacing:10px;
                  background:linear-gradient(135deg,#4f6ef7,#a78bfa);
                  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                  background-clip:text;font-family:'Courier New',monospace;padding:4px 0 8px;">
                  ${codeFormatted}
                </div>
                <div style="margin-top:14px;display:inline-block;background:rgba(245,158,11,0.1);
                  border:1px solid rgba(245,158,11,0.25);border-radius:8px;
                  padding:6px 16px;">
                  <span style="color:#f59e0b;font-size:12px;font-weight:600;">⏱ Expira em 15 minutos</span>
                </div>
              </div>

              <!-- ═══ SECURITY NOTE ═══ -->
              <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);
                border-radius:12px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                  🛡️ <strong style="color:#94a3b8;">Não foi você?</strong> Ignore este e-mail.
                  Sua senha permanece inalterada e nenhuma ação será tomada.
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#334155;line-height:1.6;text-align:center;">
                🔒 Este código é <strong>pessoal e intransferível</strong>.<br/>
                Nunca compartilhe com ninguém, nem com nossa equipe.
              </p>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:rgba(13,15,20,0.8);border-top:1px solid rgba(79,110,247,0.1);
              padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#1e293b;font-size:11px;">
                © ${new Date().getFullYear()} Smart Cash Monitor · Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetCodeEmail };
