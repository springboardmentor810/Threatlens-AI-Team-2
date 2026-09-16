export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper shadow-[0_1px_0_0_rgba(21,22,26,0.03)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, eyebrow, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-line px-5 py-4 ${className}`}>
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500 mb-1">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
      </div>
      {action}
    </div>
  );
}
