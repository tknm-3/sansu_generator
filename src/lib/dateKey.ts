/** エポックms → ローカルタイムの YYYY-MM-DD 文字列。UTCではなく端末ローカル日付。 */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
