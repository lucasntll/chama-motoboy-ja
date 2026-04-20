/**
 * Calcula o valor da entrega (frete) com base no horário atual.
 * - Diurno (07:00 às 17:59): R$ 7,00
 * - Noturno (18:00 às 06:59): R$ 10,00
 */
export const DAYTIME_FEE = 7;
export const NIGHTTIME_FEE = 10;

export function getDeliveryFee(date: Date = new Date()): number {
  const hour = date.getHours();
  // Diurno: 7h até 17h59 (hour entre 7 e 17 inclusive)
  if (hour >= 7 && hour < 18) return DAYTIME_FEE;
  // Noturno: 18h até 23h59 e 00h até 06h59
  return NIGHTTIME_FEE;
}
