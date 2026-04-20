
import { Context } from './types';

/**
 * Resuelve variables en formato {{path.to.var}} dentro de un texto.
 */
export function resolveVariables(text: string, ctx: Context): string {
  if (!text || typeof text !== 'string') return text || '';
  
  let r = text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split('.');
    let value: any = ctx;
    
    for (const part of parts) {
      if (value === null || value === undefined) return match;
      value = value[part];
    }
    
    return value !== null && value !== undefined ? String(value) : match;
  });

  // Soporte básico para bloques de Yumpii
  r = r.replace(/\{\{#each[^}]*\}\}[\s\S]*?\{\{\/each\}\}/g, "[Lista dinámica]");
  r = r.replace(/\{\{#if[^}]*\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
  
  return r;
}

/**
 * Aplica formato básico de WhatsApp (*negrita*, _cursiva_, ~tachado~)
 */
export function formatWhatsAppText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br/>');
}

/**
 * Obtiene el sello de tiempo actual en formato HH:MM
 */
export function getTimestamp(): string {
  const d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

/**
 * Prueba un patrón regex contra una lista de candidatos
 */
export function testRegex(pattern: string, candidates: (string | undefined)[]): boolean {
  try {
    const re = new RegExp(pattern, 'i');
    return candidates.some(c => c && re.test(c));
  } catch (e) {
    console.error('Invalid regex:', pattern);
    return false;
  }
}
