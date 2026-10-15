// Строка «подпись — значение» для таблиц на экранах
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-white/50">{label}</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}
