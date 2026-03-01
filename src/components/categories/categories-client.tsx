"use client";

import { useState, useEffect } from "react";
import { CategoriesTable } from "@/components/categories/categories-table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive, Loader2 } from "lucide-react";
import { getCategories } from "@/lib/actions/category-actions";
import { CategoryGroup } from "@prisma/client";

type Category = {
  id: string;
  name: string;
  group: CategoryGroup;
  color: string;
  icon: string;
  isArchived: boolean;
  userId: string;
};

type CategoriesClientProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export function CategoriesClient({ searchParams }: CategoriesClientProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories when component mounts or showArchived changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories(showArchived);
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [showArchived]);

  const handleArchivedToggle = () => {
    setShowArchived(prev => !prev);
  };
  
  return (
    <>
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={handleArchivedToggle}
          />
          <Label htmlFor="show-archived" className="flex items-center">
            <Archive className="h-4 w-4 mr-2" />
            Show Archived
          </Label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CategoriesTable 
          categories={categories} 
          showArchived={showArchived}
        />
      )}
    </>
  );
}
