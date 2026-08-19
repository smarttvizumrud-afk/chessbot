export type ModeIcon = 'bullet' | 'blitz' | 'rapid' | 'classic' | 'puzzles';

type Props = {
  icon: ModeIcon;
  label: string;
  value?: number | string;
  count: number;
  unit: string;
};

export function ProfileRatingMode({ icon, label, value, count, unit }: Props) {
  return (
    <div className="rating-mode">
      <span className={`mode-mark mode-${icon}`} />
      <div>
        <strong>{label}</strong>
        <p>{value ?? '?'} {'\u00b7'} {count} {unit}</p>
      </div>
    </div>
  );
}
