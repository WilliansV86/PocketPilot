// Centralized UI constants for consistent design across the application

// Spacing constants
export const SPACING = {
  // Padding
  PADDING: {
    MOBILE: 'p-4',
    DESKTOP: 'p-6',
    CARD: 'p-6',
    CARD_MOBILE: 'p-4',
    SECTION: 'py-6',
    SECTION_MOBILE: 'py-4',
  },
  
  // Margins
  MARGIN: {
    SECTION: 'mb-6',
    SECTION_MOBILE: 'mb-4',
    CARD: 'mb-4',
    ITEM: 'mb-2',
  },
  
  // Gap between items
  GAP: {
    SMALL: 'gap-2',
    MEDIUM: 'gap-4',
    LARGE: 'gap-6',
    XLARGE: 'gap-8',
  },
  
  // Space between sections
  SPACE_Y: {
    SMALL: 'space-y-2',
    MEDIUM: 'space-y-4',
    LARGE: 'space-y-6',
    XLARGE: 'space-y-8',
  },
} as const;

// Typography constants
export const TYPOGRAPHY = {
  // Page titles
  PAGE_TITLE: 'text-2xl font-semibold text-foreground',
  
  // Section titles
  SECTION_TITLE: 'text-lg font-medium text-foreground',
  SECTION_SUBTITLE: 'text-sm text-muted-foreground',
  
  // Card titles
  CARD_TITLE: 'text-base font-medium text-foreground',
  CARD_SUBTITLE: 'text-sm text-muted-foreground',
  
  // Labels
  LABEL: 'text-sm text-muted-foreground',
  LABEL_REQUIRED: 'text-sm text-muted-foreground font-medium',
  
  // Numbers and amounts
  AMOUNT_LARGE: 'text-xl font-bold',
  AMOUNT_MEDIUM: 'text-lg font-semibold',
  AMOUNT_SMALL: 'text-base font-medium',
  
  // Body text
  BODY: 'text-sm text-foreground',
  BODY_LARGE: 'text-base text-foreground',
  
  // Captions and helpers
  CAPTION: 'text-xs text-muted-foreground',
  HELPER: 'text-xs text-muted-foreground',
  
  // Status and badges
  BADGE: 'text-xs font-medium',
  STATUS: 'text-sm font-medium',
} as const;

// Card constants
export const CARD = {
  // Base card styles
  BASE: 'rounded-xl shadow-sm border bg-card',
  BASE_MOBILE: 'rounded-lg shadow-sm border bg-card',
  
  // Hover effects
  HOVER: 'hover:shadow-md transition-shadow duration-200',
  HOVER_SUBTLE: 'hover:shadow-sm transition-shadow duration-200',
  
  // Interactive cards
  INTERACTIVE: 'cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1',
  
  // Summary cards
  SUMMARY: 'rounded-xl shadow-sm border bg-card p-6 hover:shadow-md transition-shadow duration-200',
  SUMMARY_MOBILE: 'rounded-lg shadow-sm border bg-card p-4 hover:shadow-md transition-shadow duration-200',
  
  // Content cards
  CONTENT: 'rounded-xl shadow-sm border bg-card p-6',
  CONTENT_MOBILE: 'rounded-lg shadow-sm border bg-card p-4',
} as const;

// Button constants
export const BUTTON = {
  // Spacing with icons
  ICON_SPACING: 'gap-2',
  
  // Sizes
  SIZE_SM: 'min-h-[44px] h-11 px-3 text-xs md:h-8 md:px-3',
  SIZE_MD: 'min-h-[44px] h-11 px-4 text-sm md:h-9 md:px-4',
  SIZE_LG: 'min-h-[44px] h-11 px-6 text-base md:h-10 md:px-6',
  SIZE_XL: 'min-h-[44px] h-12 px-8 text-lg md:h-11 md:px-8',
  
  // Common combinations
  PRIMARY_ACTION: 'gap-2',
  SECONDARY_ACTION: 'gap-2 variant-outline',
  DESTRUCTIVE_ACTION: 'gap-2 variant-destructive',
  
  // Icon-only buttons
  ICON_ONLY: 'min-h-[44px] min-w-[44px] h-11 w-11 p-0 md:h-8 md:w-8',
  ICON_ONLY_SM: 'min-h-[44px] min-w-[44px] h-10 w-10 p-0 md:h-6 md:w-6',
  ICON_ONLY_LG: 'min-h-[44px] min-w-[44px] h-12 w-12 p-0 md:h-10 md:w-10',
} as const;

// Layout constants
export const LAYOUT = {
  // Container max widths
  CONTAINER: 'max-w-7xl mx-auto',
  CONTAINER_NARROW: 'max-w-4xl mx-auto',
  CONTAINER_WIDE: 'max-w-full mx-auto',
  
  // Responsive grids
  GRID: {
    TWO_COL: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    THREE_COL: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    FOUR_COL: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    AUTO: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    CARDS: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    SUMMARY: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4',
    CHARTS: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    MOBILE_STACK: 'grid grid-cols-1 gap-4',
  },
  
  // Flex layouts
  FLEX: {
    CENTER: 'flex items-center justify-center',
    BETWEEN: 'flex items-center justify-between',
    START: 'flex items-center justify-start',
    END: 'flex items-center justify-end',
    COL: 'flex flex-col',
    COL_CENTER: 'flex flex-col items-center justify-center',
    COL_BETWEEN: 'flex flex-col justify-between',
  },
  
  // Section spacing
  SECTION: 'py-6 space-y-6',
  SECTION_MOBILE: 'py-4 space-y-4',
} as const;

// Animation constants
export const ANIMATION = {
  // Durations
  DURATION: {
    FAST: 'duration-150',
    NORMAL: 'duration-200',
    SLOW: 'duration-300',
  },
  
  // Easings
  EASE: {
    IN: 'ease-in',
    OUT: 'ease-out',
    IN_OUT: 'ease-in-out',
  },
  
  // Common transitions
  TRANSITION: 'transition-all duration-200 ease-in-out',
  TRANSITION_FAST: 'transition-all duration-150 ease-in-out',
  TRANSITION_SLOW: 'transition-all duration-300 ease-in-out',
  
  // Hover effects
  HOVER_SCALE: 'hover:scale-105 transition-transform duration-200',
  HOVER_LIFT: 'hover:-translate-y-1 transition-transform duration-200',
  HOVER_BRIGHT: 'hover:brightness-110 transition-all duration-200',
} as const;

// Color constants for semantic use
export const COLORS = {
  // Status colors
  SUCCESS: 'text-green-600 bg-green-50 border-green-200',
  WARNING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  ERROR: 'text-red-600 bg-red-50 border-red-200',
  INFO: 'text-blue-600 bg-blue-50 border-blue-200',
  
  // Text colors
  TEXT_PRIMARY: 'text-foreground',
  TEXT_SECONDARY: 'text-muted-foreground',
  TEXT_TERTIARY: 'text-muted-foreground/70',
  
  // Background colors
  BG_PRIMARY: 'bg-background',
  BG_SECONDARY: 'bg-secondary',
  BG_MUTED: 'bg-muted',
  
  // Border colors
  BORDER_PRIMARY: 'border-border',
  BORDER_SECONDARY: 'border-border/50',
  BORDER_MUTED: 'border-muted',
} as const;

// Breakpoint constants for responsive design
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Component constants (for backward compatibility)
export const COMPONENTS = {
  CARD: CARD,
  BUTTON: BUTTON,
  TYPOGRAPHY: TYPOGRAPHY,
  LAYOUT: LAYOUT,
  SPACING: {
    CARD: {
      CARD: 'mb-4',
      ITEM: 'mb-2',
    },
    GAP: {
      SMALL: 'gap-2',
      MEDIUM: 'gap-4',
      LARGE: 'gap-6',
      XLARGE: 'gap-8',
    },
    SPACE_Y: {
      SMALL: 'space-y-2',
      MEDIUM: 'space-y-4',
      LARGE: 'space-y-6',
      XLARGE: 'space-y-8',
    },
  },
} as const;

// Common component patterns
export const PATTERNS = {
  // Page layout
  PAGE: 'min-h-screen bg-background',
  PAGE_CONTENT: `${LAYOUT.CONTAINER} ${LAYOUT.SECTION}`,
  
  // Card sections
  CARD_SECTION: `${CARD.CONTENT} ${COMPONENTS.SPACING.SPACE_Y.MEDIUM}`,
  CARD_SECTION_MOBILE: `${CARD.CONTENT_MOBILE} ${COMPONENTS.SPACING.SPACE_Y.MEDIUM}`,
  
  // Form layouts
  FORM: 'space-y-6',
  FORM_FIELD: 'space-y-2',
  FORM_ACTIONS: 'flex gap-3 pt-4',
  
  // Table layouts
  TABLE_CONTAINER: 'rounded-xl border bg-card overflow-hidden',
  TABLE_HEADER: 'bg-muted/50 border-b',
  TABLE_ROW: 'border-b hover:bg-muted/50 transition-colors md:py-2 py-3',
  TABLE_SCROLL_CONTAINER: 'rounded-xl border bg-card overflow-x-auto',
  
  // Navigation
  NAV_CONTAINER: 'flex items-center justify-between p-4 border-b bg-background',
  NAV_ITEM: 'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors',
  
  // Empty states
  EMPTY_STATE: 'flex flex-col items-center justify-center py-12 text-center',
  EMPTY_STATE_TITLE: 'text-lg font-semibold mb-2',
  EMPTY_STATE_DESCRIPTION: 'text-muted-foreground mb-4',
  EMPTY_STATE_ACTION: 'mt-4',
  
  // Mobile optimizations
  MOBILE: {
    TABLE: 'overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0',
    CARD_GRID: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    CHART_FULL: 'w-full lg:col-span-2',
    STACK_VERTICAL: 'flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4',
  },
} as const;
