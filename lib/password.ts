import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

// Alfabeto sin caracteres ambiguos (0/O, 1/l/I) para que la contraseña
// temporal sea fácil de leer y copiar al enviarla por WhatsApp.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Genera una contraseña temporal legible (por defecto 10 caracteres). */
export function generateTempPassword(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
