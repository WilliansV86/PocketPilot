// Client-side wrapper for Server Actions to handle browser preview origin issues
// This file provides a fallback mechanism when Server Actions fail due to origin mismatch

export async function safeServerAction<T>(
  action: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    // Check if it's the origin mismatch error
    if (error?.digest === '3266008295@E80') {
      // Origin mismatch error - show user-friendly message
      console.warn('Server Action failed due to browser preview origin mismatch');
      
      // Show toast notification if available
      if (typeof window !== 'undefined') {
        // Import toast dynamically to avoid SSR issues
        const { toast } = await import('sonner');
        toast.error(
          'Server Actions are limited in browser preview. Please open http://localhost:3000 directly for full functionality.',
          { duration: 5000 }
        );
      }
      
      // Return fallback if provided
      if (fallback) {
        return await fallback();
      }
      
      // Re-throw with user-friendly message
      throw new Error('Server Actions are limited in browser preview. Please open http://localhost:3000 directly.');
    }
    
    // Re-throw other errors
    throw error;
  }
}
