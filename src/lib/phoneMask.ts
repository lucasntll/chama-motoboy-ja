export const applyPhoneMask = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const stripPhoneMask = (value: string): string => value.replace(/\D/g, "");

/**
 * Normaliza qualquer telefone para o padrão de 11 dígitos (DDD + número).
 * Remove espaços, hífen, parênteses, +55 e qualquer caractere não numérico.
 * Ex: "+55 (35) 99830-9121" -> "35998309121"
 */
export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  // Mantém apenas os 11 últimos dígitos (DDD + número), descartando 55 extra
  return digits.slice(-11);
};
