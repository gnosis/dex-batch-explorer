export function formatTx(tx: string): string {
  return `${tx.substr(0, 6)}...${tx.substr(-4)}`;
}

export function zeroPad(value: number, places: number) {
  var zero = places - value.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + value;
}

export function formatTime(seconds: number): string {
  return `${~~(seconds / 60)}:${zeroPad(seconds % 60, 2)}`;
}

export function formatDate(date: Date): string {
  const year = zeroPad(date.getUTCFullYear(), 4);
  const month = zeroPad(date.getUTCMonth() + 1, 2);
  const day = zeroPad(date.getUTCDate(), 2);
  return `${year}-${month}-${day}`;
}
