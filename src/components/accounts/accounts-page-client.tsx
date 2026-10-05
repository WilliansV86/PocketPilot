"use client";


import { I18nText } from "@/components/language-provider";
import { retiredPreviewStorage } from "@/lib/retired-preview-storage";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, Edit, PlusCircle } from "lucide-react";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

interface AccountsPageClientProps {
  children: React.ReactNode;
}

export function AccountsPageClient({ children }: AccountsPageClientProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    // Update counts when component mounts or localStorage changes
    const updateCounts = () => {
      const deletedIds = JSON.parse(retiredPreviewStorage.getItem('deletedAccounts') || '[]');
      const updatedAccounts = JSON.parse(retiredPreviewStorage.getItem('updatedAccounts') || '{}');
      const newAccounts = JSON.parse(retiredPreviewStorage.getItem('newAccounts') || '[]');
      setDeletedCount(deletedIds.length);
      setUpdatedCount(Object.keys(updatedAccounts).length);
      setNewCount(newAccounts.length);
    };

    updateCounts();
    
    // Listen for storage changes (in case of multiple tabs)
    const handleStorageChange = () => {
      updateCounts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const clearPreviewChanges = () => {
    setIsClearing(true);
    try {
      retiredPreviewStorage.removeItem('deletedAccounts');
      retiredPreviewStorage.removeItem('updatedAccounts');
      retiredPreviewStorage.removeItem('newAccounts');
      setDeletedCount(0);
      setUpdatedCount(0);
      setNewCount(0);
      toast.success("Preview changes cleared. Refreshing page...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Failed to clear preview changes");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div>
      {children}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {(deletedCount > 0 || updatedCount > 0 || newCount > 0) && (
            <div className="flex gap-2">
              {deletedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  {deletedCount}{" "}<I18nText text={"account"}/>{""}{deletedCount > 1 ? 's' : ''}{" "}<I18nText text={"hidden (preview mode)"}/>{" "}</Badge>
              )}
              {updatedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  {updatedCount}{" "}<I18nText text={"account"}/>{""}{updatedCount > 1 ? 's' : ''}{" "}<I18nText text={"updated (preview mode)"}/>{" "}</Badge>
              )}
              {newCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <PlusCircle className="h-3 w-3 mr-1" />
                  {newCount}{" "}<I18nText text={"account"}/>{""}{newCount > 1 ? 's' : ''}{" "}<I18nText text={"created (preview mode)"}/>{" "}</Badge>
              )}
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearPreviewChanges}
          disabled={isClearing || (deletedCount === 0 && updatedCount === 0 && newCount === 0)}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isClearing ? 'animate-spin' : ''}`} />{" "}<I18nText text={"Clear Preview Changes"}/>{" "}</Button>
      </div>
    </div>
  );
}
