"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Edit, 
  MoreHorizontal, 
  Trash,
  Archive,
  RefreshCcw,
  AlertCircle,
  Tag
} from "lucide-react";
import { CategoryGroup } from "@prisma/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { deleteCategory, toggleCategoryArchiveStatus } from "@/lib/actions/category-actions";
import { toast } from "sonner";
import { BUTTON } from "@/lib/ui-constants";

// Type definitions
type Category = {
  id: string;
  name: string;
  group: CategoryGroup;
  color: string;
  icon: string;
  isArchived: boolean;
  userId: string;
};

type CategoriesTableProps = {
  categories: Category[];
  showArchived: boolean;
};

export function CategoriesTable({ categories, showArchived }: CategoriesTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Handle delete operation
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const result = await deleteCategory(id);
      
      if (!result.success) {
        toast.error(result.error || "Failed to delete category");
      } else {
        toast.success(result.message || "Category deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle archive/unarchive operation
  const handleArchiveToggle = async (id: string) => {
    try {
      setIsUpdating(id);
      const result = await toggleCategoryArchiveStatus(id);
      
      if (!result.success) {
        toast.error(result.error || "Failed to update category status");
      } else {
        toast.success(result.message || "Category status updated");
      }
    } catch (error) {
      console.error("Error updating category status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(null);
    }
  };

  // Get a color for a category group
  const getCategoryGroupColor = (group: CategoryGroup) => {
    switch(group) {
      case "INCOME":
        return "bg-green-100 text-green-800";
      case "NEEDS":
        return "bg-blue-100 text-blue-800";
      case "WANTS":
        return "bg-purple-100 text-purple-800";
      case "SAVINGS":
        return "bg-teal-100 text-teal-800";
      case "DEBT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group categories by their CategoryGroup
  const groupedCategories = (categories || []).reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<CategoryGroup, Category[]>);

  // Get category groups in order (INCOME, NEEDS, WANTS, SAVINGS, DEBT)
  const categoryGroups = Object.keys(groupedCategories) as CategoryGroup[];

  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No categories found. Create your first category to get started.
              </TableCell>
            </TableRow>
          ) : (
            categoryGroups.map((group) => (
              <React.Fragment key={group}>
                {/* Group header */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell colSpan={4} className="py-2">
                    <Badge variant="outline" className={getCategoryGroupColor(group)}>
                      {group.charAt(0) + group.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
                {/* Categories in this group */}
                {groupedCategories[group]?.filter(cat => showArchived || !cat.isArchived).map((category) => (
                  <TableRow key={category.id} className={category.isArchived ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tag className="h-4 w-4 mr-2" />
                      {category.icon}
                    </TableCell>
                    <TableCell>
                      {category.isArchived ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          Archived
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className={BUTTON.ICON_ONLY}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/categories/${category.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {/* Archive/Unarchive toggle */}
                          <DropdownMenuItem
                            onClick={() => handleArchiveToggle(category.id)}
                            disabled={isUpdating === category.id}
                          >
                            {category.isArchived ? (
                              <>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" /> Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          {/* Delete action */}
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
                            disabled={isDeleting === category.id}
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
