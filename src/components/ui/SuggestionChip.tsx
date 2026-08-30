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
      className="rounded-full border border-line bg-zinc-900/50 px-3.5 py-1.5 text-left text-[12.5px] text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
