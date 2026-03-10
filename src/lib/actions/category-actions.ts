"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CategoryGroup } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";

// Define the validation schema for category creation/update
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.nativeEnum(CategoryGroup),
  color: z.string().default("#6366F1"),
  icon: z.string().default("tag"),
  isArchived: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// Category actions
export async function getCategories(includeArchived: boolean = false) {
  try {
    const user = await getDefaultUser();
    
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: [
        { group: "asc" },
        { name: "asc" },
      ],
    });
    
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!category) {
      return { success: false, error: "Category not found" };
    }
    
    return { success: true, data: category };
  } catch (error) {
    console.error(`Failed to fetch category ${id}:`, error);
    return { success: false, error: "Failed to load category details" };
  }
}

export async function createCategory(formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = categorySchema.parse({
      name: formData.get("name"),
      group: formData.get("group"),
      color: formData.get("color") || "#6366F1",
      icon: formData.get("icon") || "tag",
      isArchived: false, // New categories are not archived by default
    });
    
    // Get the default user
    const user = await getDefaultUser();
    
    // Create the category
    const category = await prisma.category.create({
      data: {
        ...parsed,
        userId: user.id,
      },
    });
    
    revalidatePath("/categories");
    return { success: true, data: category, message: "Category created successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid category data" };
    }
    
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = categorySchema.parse({
      name: formData.get("name"),
      group: formData.get("group"),
      color: formData.get("color") || "#6366F1",
      icon: formData.get("icon") || "tag",
      isArchived: formData.get("isArchived") === "true",
    });
    
    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: parsed,
    });
    
    revalidatePath("/categories");
    return { success: true, data: updatedCategory, message: "Category updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid category data" };
    }
    
    console.error(`Failed to update category ${id}:`, error);
    return { success: false, error: "Failed to update category" };
  }
}

// Archive/unarchive category (safer than deletion)
export async function toggleCategoryArchiveStatus(id: string) {
  try {
    // Get the current category
    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!category) {
      return { success: false, error: "Category not found" };
    }
    
    // Toggle the isArchived status
    await prisma.category.update({
      where: { id },
      data: {
        isArchived: !category.isArchived
      },
    });
    
    revalidatePath("/categories");
    return { 
      success: true, 
      message: category.isArchived ? "Category restored successfully" : "Category archived successfully" 
    };
  } catch (error) {
    console.error(`Failed to update archive status for category ${id}:`, error);
    return { success: false, error: "Failed to update category archive status" };
  }
}

// Try to delete a category, but only if it's not being used in any transactions
export async function deleteCategory(id: string) {
  try {
    // First check if the category is used in any transactions
    const transactionsUsingCategory = await prisma.transaction.count({
      where: { categoryId: id },
    });
    
    // If the category is being used, don't allow deletion
    if (transactionsUsingCategory > 0) {
      return { 
        success: false, 
        error: `Cannot delete this category as it is used in ${transactionsUsingCategory} transaction(s). Archive it instead.` 
      };
    }
    
    // Safe to delete since no transactions are using this category
    await prisma.category.delete({
      where: { id },
    });
    
    revalidatePath("/categories");
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error(`Failed to delete category ${id}:`, error);
    return { success: false, error: "Failed to delete category" };
  }
}

// Helper function to get categories grouped by their CategoryGroup
export async function getCategoriesByGroup(includeArchived: boolean = false) {
  try {
    const user = await getDefaultUser();
    
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: [
        { group: "asc" },
        { name: "asc" },
      ],
    });
    
    // Group categories by their group property
    const groupedCategories = categories.reduce((acc, category) => {
      if (!acc[category.group]) {
        acc[category.group] = [];
      }
      acc[category.group].push(category);
      return acc;
    }, {} as Record<string, typeof categories>);
    
    return { success: true, data: groupedCategories };
  } catch (error) {
    console.error("Failed to fetch categories by group:", error);
    return { success: false, error: "Failed to load categories" };
  }
}
