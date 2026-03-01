// Design tokens for consistent UI across PocketPilot

// Typography tokens
export const TYPOGRAPHY = {
  // Page titles
  PAGE_TITLE: "text-2xl font-semibold tracking-tight",
  
  // Section titles
  SECTION_TITLE: "text-base font-medium",
  
  // Table headers
  TABLE_HEADER: "text-xs uppercase tracking-wide text-muted-foreground font-medium",
  
  // Body text
  BODY: "text-sm",
  
  // Money/amounts - tabular numbers for alignment
  AMOUNT: "font-variant-numeric tabular-nums font-semibold",
  AMOUNT_SMALL: "font-variant-numeric tabular-nums font-semibold text-sm",
  AMOUNT_LARGE: "font-variant-numeric tabular-nums font-semibold text-lg",
  AMOUNT_XL: "font-variant-numeric tabular-nums font-semibold text-xl",
  
  // Card titles
  CARD_TITLE: "text-base font-medium",
  CARD_SUBTITLE: "text-sm text-muted-foreground",
  
  // Button text
  BUTTON_TEXT: "text-sm font-medium",
  
  // Status text
  STATUS_TEXT: "text-xs font-medium",
} as const;

// Color tokens
export const COLORS = {
  // Currency colors
  CURRENCY: {
    INCOME: "text-green-600 dark:text-green-400",
    EXPENSE: "text-red-600 dark:text-red-400", 
    TRANSFER: "text-blue-600 dark:text-blue-400",
    NEUTRAL: "text-foreground",
    POSITIVE: "text-green-600 dark:text-green-400",
    NEGATIVE: "text-red-600 dark:text-red-400",
    ZERO: "text-muted-foreground",
  },
  
  // Sidebar colors
  SIDEBAR: {
    ACTIVE: "bg-accent text-accent-foreground border-l-2 border-primary",
    HOVER: "hover:bg-accent/50 hover:text-accent-foreground",
    NORMAL: "text-muted-foreground hover:text-foreground",
    GROUP_TITLE: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
  },
  
  // Card styles
  CARD: {
    DEFAULT: "bg-card text-card-foreground rounded-lg border shadow-sm",
    HOVER: "hover:shadow-md transition-shadow duration-200",
    INTERACTIVE: "hover:bg-accent/50 cursor-pointer transition-colors duration-150",
  },
  
  // Status colors
  STATUS: {
    SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    NEUTRAL: "bg-muted text-muted-foreground",
  },
} as const;

// Layout tokens
export const LAYOUT = {
  // Spacing
  SPACING: {
    SECTION: "space-y-6",
    CARD: "space-y-4",
    FORM: "space-y-3",
    LIST: "space-y-2",
    TIGHT: "space-y-1",
  },
  
  // Container sizes
  CONTAINER: {
    DEFAULT: "max-w-7xl mx-auto",
    NARROW: "max-w-4xl mx-auto",
    WIDE: "max-w-full",
  },
  
  // Page layout
  PAGE: {
    HEADER: "flex items-center justify-between mb-6",
    CONTENT: "space-y-6",
  },
} as const;

// Component tokens
export const COMPONENTS = {
  // Button styles
  BUTTON: {
    PRIMARY: "bg-primary text-primary-foreground hover:bg-primary/90",
    SECONDARY: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    GHOST: "hover:bg-accent hover:text-accent-foreground",
    OUTLINE: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    DESTRUCTIVE: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ICON_ONLY: "h-8 w-8 p-0",
  },
  
  // Table styles
  TABLE: {
    CONTAINER: "w-full",
    HEADER: "border-b bg-muted/50",
    ROW: "border-b transition-colors hover:bg-muted/30",
    ROW_ALTERNATE: "border-b transition-colors hover:bg-muted/30 bg-muted/10",
    CELL: "px-4 py-3 text-sm",
    CELL_COMPACT: "px-3 py-2 text-sm",
    CELL_AMOUNT: "px-4 py-3 text-sm text-right font-variant-numeric tabular-nums font-semibold",
  },
  
  // Card styles
  CARD: {
    CONTAINER: "rounded-lg border bg-card text-card-foreground shadow-sm",
    HEADER: "flex flex-col space-y-1.5 p-6",
    CONTENT: "p-6 pt-0",
    FOOTER: "flex items-center p-6 pt-0",
    COMPACT: "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
  },
  
  // Form styles
  FORM: {
    FIELD: "space-y-2",
    LABEL: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    INPUT: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    ERROR: "text-sm font-medium text-destructive",
  },
  
  // Navigation styles
  NAV: {
    ITEM: "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
    ITEM_ACTIVE: "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-accent text-accent-foreground border-l-2 border-primary transition-all duration-200",
    GROUP: "space-y-1",
    GROUP_HEADER: "px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider",
  },
} as const;

// Animation tokens
export const ANIMATIONS = {
  // Transitions
  TRANSITION: {
    FAST: "transition-all duration-150",
    NORMAL: "transition-all duration-200",
    SLOW: "transition-all duration-300",
    COLOR: "transition-colors duration-200",
    TRANSFORM: "transition-transform duration-200",
  },
  
  // Hover effects
  HOVER: {
    LIFT: "hover:shadow-lg hover:-translate-y-0.5",
    SCALE: "hover:scale-105",
    GLOW: "hover:shadow-lg hover:shadow-primary/20",
  },
  
  // Loading states
  LOADING: {
    SPIN: "animate-spin",
    PULSE: "animate-pulse",
    BOUNCE: "animate-bounce",
  },
} as const;

// Responsive tokens
export const RESPONSIVE = {
  // Mobile adjustments
  MOBILE: {
    TABLE_CELL: "px-3 py-2 text-sm",
    CARD_COMPACT: "p-4",
    NAV_COMPACT: "px-2 py-1",
  },
  
  // Breakpoint adjustments
  BREAKPOINTS: {
    SM: "sm:",
    MD: "md:",
    LG: "lg:",
    XL: "xl:",
  },
} as const;

// Export all tokens as a single object for convenience
export const THEME = {
  TYPOGRAPHY,
  COLORS,
  LAYOUT,
  COMPONENTS,
  ANIMATIONS,
  RESPONSIVE,
} as const;
