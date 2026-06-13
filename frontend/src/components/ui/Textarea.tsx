import type { TextareaHTMLAttributes } from "react";

type Props = {
  label?: string;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({
  label,
  hint,
  className,
  id,
  ...props
}: Props) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="block text-sm font-medium text-gray-800" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        className={`min-h-[110px] w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-purple-500 ${className || ""}`}
        {...props}
      />
      {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

