import React from "react";
import { Button } from "./button";
import { PATTERNS, TYPOGRAPHY } from "@/lib/ui-constants";

interface EmptyStateProps {
  icon?: React.ReactNode;
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
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className={PATTERNS.EMPTY_STATE}>
      {icon ? (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      ) : null}
      
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
