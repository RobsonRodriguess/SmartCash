const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    // senha é opcional — quem usa Google não tem senha local
    password: {
      type: String,
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    // ── Recuperação de senha ──────────────────────────────────────────────
    // Hash SHA-256 do código OTP (6 dígitos) enviado por e-mail
    resetPasswordCode: { type: String, select: false },
    // Expiração do código (15 minutos)
    resetPasswordExpire: { type: Date, select: false },
    // Hash bcrypt da senha anterior — impede reuso da mesma senha
    previousPasswordHash: { type: String, select: false },
  },
  { timestamps: true }
);

// hash antes de salvar, só se a senha foi modificada
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
