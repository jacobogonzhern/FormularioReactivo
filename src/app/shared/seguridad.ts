/**
 * Cifra (hash SHA-256) una contraseña con la Web Crypto API del navegador.
 * Así la contraseña nunca se muestra ni se guarda en texto plano.
 */
export async function cifrarPassword(password: string): Promise<string> {
  const datos = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Fecha de hoy en formato AAAA-MM-DD (para el atributo max del calendario) */
export function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}
