"use client";

interface SuggestionChipProps {
  label: string;
  onClick: (label: string) => void;
  disabled?: boolean;
}

export default function SuggestionChip({ label, onClick, disabled }: SuggestionChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(label)}
      className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-[13px] text-ink/75 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
