"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

interface TransactionsPageClientProps {
  children: React.ReactNode;
}

export function TransactionsPageClient({ children }: TransactionsPageClientProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    // Update deleted count when component mounts or localStorage changes
    const updateDeletedCount = () => {
      try {
        const deletedIds = JSON.parse(localStorage.getItem('deletedTransactions') || '[]');
        setDeletedCount(deletedIds.length);
      } catch (error) {
        console.error('Error updating deleted count:', error);
        setDeletedCount(0);
      }
    };

    updateDeletedCount();
    
    // Listen for storage changes (in case of multiple tabs)
    const handleStorageChange = () => {
      updateDeletedCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const clearPreviewDeletions = () => {
    setIsClearing(true);
    try {
      localStorage.removeItem('deletedTransactions');
      setDeletedCount(0);
      toast.success("Preview deletions cleared. Refreshing page...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear preview deletions:', error);
      toast.error("Failed to clear preview deletions");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {deletedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              You have {deletedCount} preview deletion{deletedCount > 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearPreviewDeletions}
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Preview
              </>
            )}
          </Button>
        </div>
      )}
      
      <div>
        {children}
      </div>
    </div>
  );
}
