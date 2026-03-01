"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Archive,
  ArchiveRestore,
  Trash2,
  GripVertical,
  Search,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { formatCurrency } from "@/lib/utils";
import { getGroupInfo, getCurrentMonth, getMonthDisplay } from "@/lib/category-helpers";

interface Category {
  id: string;
  name: string;
  group: string;
  color: string;
  icon: string;
  isArchived: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryGroupData {
  categories: Category[];
  totalAmount: number;
  count: number;
}

interface CategoriesEnhancedProps {
  initialCategories: Category[];
  initialGroupData: Record<string, CategoryGroupData>;
  onCategoryUpdate: () => void;
}

export function CategoriesEnhanced({
  initialCategories,
  initialGroupData,
  onCategoryUpdate
}: CategoriesEnhancedProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [groupData, setGroupData] = useState<Record<string, CategoryGroupData>>(initialGroupData);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);

  // Filter categories based on search and archived status
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cat.group.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived || !cat.isArchived;
    return matchesSearch && matchesArchived;
  });

  // Group filtered categories
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = {
        categories: [],
        totalAmount: 0,
        count: 0
      };
    }
    
    const groupInfo = getGroupInfo(category.group as any);
    const monthlyTotal = (groupData[category.group as any]?.categories.find((c: any) => c.id === category.id) as any)?.monthlyTotal || 0;
    
    acc[category.group].categories.push({
      ...category,
      monthlyTotal
    } as any);
    acc[category.group].totalAmount += monthlyTotal;
    acc[category.group].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const toggleGroupCollapse = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleCategoryUpdate = () => {
    onCategoryUpdate();
  };

  const handleCreateSuccess = () => {
    setCreateFormOpen(false);
    handleCategoryUpdate();
  };

  const handleEditSuccess = () => {
    setEditingCategory(null);
    handleCategoryUpdate();
  };

  const handleResetDefaults = async () => {
    if (!confirm("This will create default categories if they don't exist. Continue?")) {
      return;
    }

    try {
      const response = await fetch("/api/categories/reset-defaults", {
        method: "POST",
      });

      if (response.ok) {
        handleCategoryUpdate();
      }
    } catch (error) {
      console.error("Failed to reset defaults:", error);
    }
  };

  const groupOrder = ["INCOME", "NEEDS", "WANTS", "SAVINGS", "DEBT", "OTHER"];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <label htmlFor="show-archived" className="text-sm font-medium">
              Show archived
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to defaults
          </Button>
          
          <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
              </DialogHeader>
              <CategoryForm
                mode="create"
                onSuccess={handleCreateSuccess}
                onCancel={() => setCreateFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Month:</label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-auto"
        />
        <span className="text-sm text-muted-foreground">
          {getMonthDisplay(selectedMonth)}
        </span>
      </div>

      {/* Category Groups */}
      <div className="space-y-4">
        {groupOrder.map(group => {
          const groupData = groupedCategories[group];
          if (!groupData || groupData.categories.length === 0) return null;

          const groupInfo = getGroupInfo(group as any);
          const isCollapsed = collapsedGroups.has(group);

          return (
            <Card key={group}>
              <Collapsible open={!isCollapsed} onOpenChange={(open) => {
                if (open) {
                  setCollapsedGroups(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(group);
                    return newSet;
                  });
                } else {
                  setCollapsedGroups(prev => new Set(prev).add(group));
                }
              }}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: groupInfo.color }}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{groupInfo.name}</CardTitle>
                          <CardDescription>{groupInfo.description}</CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(groupData.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {groupData.count} categories
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-2">
                    {groupData.categories
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((category: any) => (
                        <div
                          key={category.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            category.isArchived ? 'opacity-60 bg-muted/30' : 'bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {category.name}
                                {category.isArchived && (
                                  <Badge variant="secondary" className="text-xs">
                                    Archived
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {category.monthlyTotal !== undefined && (
                                  <span>{formatCurrency(category.monthlyTotal)} this month</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => {
                              if (!open) setEditingCategory(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Category</DialogTitle>
                                </DialogHeader>
                                <CategoryForm
                                  mode="edit"
                                  category={editingCategory as any}
                                  onSuccess={handleEditSuccess}
                                  onCancel={() => setEditingCategory(null)}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first category"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
