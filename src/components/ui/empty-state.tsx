import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { PATTERNS, TYPOGRAPHY } from "@/lib/ui-constants";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className={PATTERNS.EMPTY_STATE}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className={PATTERNS.EMPTY_STATE_TITLE}>{title}</h3>
      <p className={PATTERNS.EMPTY_STATE_DESCRIPTION}>{description}</p>
      
      <div className={PATTERNS.EMPTY_STATE_ACTION}>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            className="gap-2"
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            className="gap-2"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
