import React from "react";
import { Button } from "./button";
import { PATTERNS, TYPOGRAPHY } from "@/lib/ui-constants";

export interface EmptyStateV2Props {
  icon?: any;
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

export function EmptyStateV2({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateV2Props) {
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's a React element, render it directly
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    // If it's a component (like Lucide icons), render it with default props
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className="h-8 w-8 text-muted-foreground" />;
    }
    
    // Otherwise, render as is
    return icon;
  };

  return (
    <div className={PATTERNS.EMPTY_STATE}>
      {icon && <div className="mx-auto mb-3">{renderIcon()}</div>}
      
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
