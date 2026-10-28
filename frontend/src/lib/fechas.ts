/** yyyy-mm-dd en la zona horaria del navegador (toISOString() da la fecha UTC,
 * que en España es el día anterior entre las 00:00 y la 01:00/02:00). */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
