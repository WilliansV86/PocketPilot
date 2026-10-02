// Legacy previews saved financial records under browser-wide keys. Authenticated
// PocketPilot uses server records only; never read or recreate that shared cache.
export const retiredPreviewStorage = {
  getItem(_key: string): string | null { return null; },
  setItem(_key: string, _value: string): void {},
  removeItem(_key: string): void {},
};
