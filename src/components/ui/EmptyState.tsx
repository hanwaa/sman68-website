import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon = "📭", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-ink text-base mb-1">{title}</h3>
      {description && <p className="text-muted text-sm max-w-xs mx-auto mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary text-xs px-4 py-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
