import { cn } from "@/lib/utils";
import { COMPONENTS, TYPOGRAPHY } from "@/lib/theme/tokens";

// Ultra-fast loading skeleton with minimal rendering
export function InstantLoader({ 
  type = "page", 
  rows = 5 
}: { 
  type?: "page" | "table" | "card" | "stats";
  rows?: number;
}) {
  if (type === "page") {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
        
        {/* Content area */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="space-y-2 animate-pulse">
        {/* Table header */}
        <div className="flex gap-4 p-3 border-b bg-muted/30">
          {[...Array(4)].map((_, i) => (
            <div key={`header-${i}`} className="h-4 w-20 bg-muted rounded" />
          ))}
        </div>
        
        {/* Table rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-3 border-b">
            {[...Array(4)].map((_, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`h-4 ${colIndex === 3 ? 'w-16' : 'w-24'} bg-muted rounded`} 
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={`card-${i}`} className="border rounded-lg p-4 space-y-3">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "stats") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={`stat-${i}`} className="border rounded-lg p-4 space-y-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Minimal loading indicator for instant feedback
export function MinimalLoader() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
      </div>
    </div>
  );
}
