"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

interface AccountContextType {
  accounts: Account[];
  refreshAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children, initialAccounts }: { 
  children: React.ReactNode; 
  initialAccounts: Account[] 
}) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  const refreshAccounts = () => {
    // Apply localStorage changes
    const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
    const updatedAccounts = JSON.parse(localStorage.getItem('updatedAccounts') || '{}');
    const newAccounts = JSON.parse(localStorage.getItem('newAccounts') || '[]');
    
    // Filter out deleted accounts
    const filteredAccounts = initialAccounts.filter(a => !deletedIds.includes(a.id));
    
    // Apply updates
    const finalAccounts = filteredAccounts.map(account => {
      if (updatedAccounts[account.id]) {
        return updatedAccounts[account.id];
      }
      return account;
    });
    
    // Add new accounts
    const allAccounts = [...finalAccounts, ...newAccounts];
    
    setAccounts(allAccounts);
  };

  useEffect(() => {
    refreshAccounts();
  }, [initialAccounts]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      refreshAccounts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialAccounts]);

  return (
    <AccountContext.Provider value={{ accounts, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
}
