import { v4 as uuidv4 } from 'uuid';

export function generateOrderNo(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `BH${ymd}${random}`;
}
