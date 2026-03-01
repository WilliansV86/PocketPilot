"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Edit, 
  MoreHorizontal, 
  Trash
} from "lucide-react";

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
import { deleteCategory } from "@/lib/actions/category-actions";

// Type definitions
type CategoryGroup = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  icon?: string | null;
  categories: Category[];
};

type Category = {
  id: string;
  name: string;
};

type CategoryGroupsTableProps = {
  categoryGroups: CategoryGroup[];
};

export function CategoryGroupsTable({ categoryGroups }: CategoryGroupsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const result = await deleteCategory(id);
      
      if (!result.success) {
        console.error("Failed to delete category group:", result.error);
      }
    } catch (error) {
      console.error("Error deleting category group:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Get a color for a type of category
  const getCategoryTypeColor = (type: string) => {
    switch(type) {
      case "INCOME":
        return "bg-green-100 text-green-800";
      case "EXPENSE":
        return "bg-red-100 text-red-800";
      case "TRANSFER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No category groups found. Create your first category group to get started.
              </TableCell>
            </TableRow>
          ) : (
            categoryGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {group.color && (
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {group.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryTypeColor(group.type)}>
                    {group.type.charAt(0) + group.type.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>{group.categories?.length || 0}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/categories/groups/${group.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(group.id)}
                        disabled={isDeleting === group.id || (group.categories && group.categories.length > 0)}
                        className={`${!(group.categories && group.categories.length > 0) ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : "text-gray-400"}`}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
