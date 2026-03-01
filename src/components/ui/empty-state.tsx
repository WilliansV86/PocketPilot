import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { PATTERNS, TYPOGRAPHY } from "@/lib/ui-constants";

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
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
  const renderIcon = () => {
    if (!icon) return null;
    
    // Check if icon is a React element (JSX)
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    // If it's a LucideIcon component, render it with default styling
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-8 w-8 text-muted-foreground" />;
    }
    
    return null;
  };

  return (
    <div className={PATTERNS.EMPTY_STATE}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {renderIcon()}
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
