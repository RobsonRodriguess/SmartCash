const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendResetCodeEmail } = require('../utils/sendEmail');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, error: 'Credential do Google não fornecido.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture });
    } else if (!user.googleId) {
      // usuário já existe pelo email mas nunca logou com Google, vincula
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ success: false, error: 'Token do Google inválido.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Preencha nome, email e senha.' });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, error: 'Este email já está cadastrado.' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Informe email e senha.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Email ou senha incorretos.' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me — valida token e retorna dados do usuário
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

// ───────────────────────────────────────────────────────────────────────────
// RECUPERAÇÃO DE SENHA (fluxo 3 passos)
// ───────────────────────────────────────────────────────────────────────────

const hashCode = (code) =>
  crypto.createHash('sha256').update(code).digest('hex');

/**
 * PASSO 1 — POST /api/auth/forgot-password
 * Recebe o e-mail, gera código OTP de 6 dígitos e envia por e-mail.
 * Sempre retorna 200 para não revelar se o e-mail existe.
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Informe o e-mail.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Gera código OTP de 6 dígitos (000000 – 999999)
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Salva o hash + expiração (15 min)
      user.resetPasswordCode = hashCode(code);
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      // Envia e-mail (não bloqueia a resposta se falhar silenciosamente)
      try {
        await sendResetCodeEmail({ to: user.email, name: user.name, code });
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail:', emailErr.message);
        // Limpa o código se o e-mail falhou
        user.resetPasswordCode = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
          success: false,
          error: 'Não foi possível enviar o e-mail. Verifique as configurações de e-mail.',
        });
      }
    }

    // Resposta genérica — não revela se o e-mail existe
    res.status(200).json({
      success: true,
      message: 'Se este e-mail estiver cadastrado, você receberá o código em instantes.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
});

/**
 * PASSO 2 — POST /api/auth/verify-reset-code
 * Verifica o código OTP. Se válido, retorna um token temporário (10 min)
 * que autoriza a troca de senha (passo 3).
 */
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Informe o e-mail e o código.' });
  }

  try {
    const user = await User
      .findOne({ email: email.toLowerCase().trim() })
      .select('+resetPasswordCode +resetPasswordExpire');

    if (!user || !user.resetPasswordCode) {
      return res.status(400).json({ success: false, error: 'Código inválido ou expirado.' });
    }

    // Verifica expiração
    if (user.resetPasswordExpire < new Date()) {
      user.resetPasswordCode = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, error: 'Código expirado. Solicite um novo.' });
    }

    // Compara o hash
    if (user.resetPasswordCode !== hashCode(String(code))) {
      return res.status(400).json({ success: false, error: 'Código incorreto.' });
    }

    // Código válido — emite token de sessão de reset (10 min)
    const resetToken = jwt.sign(
      { id: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({ success: true, resetToken });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
});

/**
 * PASSO 3 — PUT /api/auth/reset-password
 * Recebe o resetToken (do passo 2) e a nova senha.
 * Valida requisitos: mín. 6 chars, 1 caractere especial, diferente da anterior.
 */
router.put('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios.' });
  }

  // Valida requisitos da senha
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'A senha deve ter no mínimo 6 caracteres.' });
  }
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  if (!hasSpecialChar) {
    return res.status(400).json({ success: false, error: 'A senha deve conter pelo menos 1 caractere especial.' });
  }

  try {
    // Decodifica e valida o token de reset
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Token inválido ou expirado. Recomece o processo.' });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(401).json({ success: false, error: 'Token de reset inválido.' });
    }

    const user = await User
      .findById(decoded.id)
      .select('+password +resetPasswordCode +resetPasswordExpire +previousPasswordHash');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    // Verifica se a nova senha é igual à atual
    if (user.password) {
      const bcrypt = require('bcryptjs');
      const isSameAsCurrent = await bcrypt.compare(password, user.password);
      if (isSameAsCurrent) {
        return res.status(400).json({
          success: false,
          error: 'A nova senha deve ser diferente da senha atual.',
        });
      }
    }

    // Aplica nova senha (o hook pre-save faz o hash)
    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Senha alterada com sucesso! Faça login com a nova senha.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
