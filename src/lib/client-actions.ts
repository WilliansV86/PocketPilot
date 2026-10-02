// Never treat a browser-only preview write as a persisted financial change.
export async function safeServerAction<T>(action: () => Promise<T>, _fallback?: () => Promise<T>): Promise<T> {
  return action();
}
