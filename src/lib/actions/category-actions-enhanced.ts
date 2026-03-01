"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CategoryGroup } from "@prisma/client";
import { prisma } from "@/lib/db";

// Enhanced validation schema
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  group: z.nativeEnum(CategoryGroup),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
  order: z.number().int().min(0, "Order must be a non-negative integer").optional(),
  isArchived: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// Helper function to get the default user
async function getDefaultUser() {
  // Try the hardcoded email first
  let user = await prisma.user.findUnique({
    where: { email: "dev@pocketpilot.local" },
  });

  // If not found, get the first available user
  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (!user) {
    throw new Error("No users found in database");
  }

  return user;
}

// Get categories with proper ordering
export async function getCategoriesEnhanced(includeArchived: boolean = false) {
  try {
    const user = await getDefaultUser();
    
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: [
        { group: "asc" },
        { order: "asc" },
        { name: "asc" },
      ] as any,
    });
    
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Failed to load categories" };
  }
}

// Get categories grouped with monthly totals
export async function getCategoriesWithGroupTotals(month: string, includeArchived: boolean = false) {
  try {
    const user = await getDefaultUser();
    
    // Get categories
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: [
        { group: "asc" },
        { order: "asc" },
        { name: "asc" },
      ] as any,
    });

    // Get monthly transaction totals by group
    const monthlyTotals = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
        type: 'EXPENSE',
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 1)
        }
      },
      _sum: {
        amount: true
      }
    });

    // Create a map of categoryId to total amount
    const categoryTotals = new Map();
    monthlyTotals.forEach(total => {
      if (total.categoryId && total._sum?.amount) {
        categoryTotals.set(total.categoryId, Number(total._sum.amount));
      }
    });

    // Group categories and calculate group totals
    const groupedCategories = categories.reduce((acc, category) => {
      if (!acc[category.group]) {
        acc[category.group] = {
          categories: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      const categoryTotal = categoryTotals.get(category.id) || 0;
      acc[category.group].categories.push(category);
      acc[category.group].totalAmount += categoryTotal;
      acc[category.group].count += 1;
      
      return acc;
    }, {} as Record<string, {
      categories: (typeof categories)[0][];
      totalAmount: number;
      count: number;
    }>);

    return { success: true, data: groupedCategories };
  } catch (error) {
    console.error("Failed to fetch categories with group totals:", error);
    return { success: false, error: "Failed to load categories" };
  }
}

// Check if category name is unique for user
export async function checkCategoryNameAvailability(name: string, excludeId?: string) {
  console.log('🔍 CHECKING NAME AVAILABILITY 🔍');
  console.log('🔍 Name:', name);
  console.log('🔍 Exclude ID:', excludeId);
  
  try {
    const user = await getDefaultUser();
    console.log('🔍 User ID:', user.id);
    
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    console.log('🔍 Existing category found:', existingCategory);

    return { 
      success: true, 
      data: { 
        available: !existingCategory,
        existingCategory: existingCategory ? {
          id: existingCategory.id,
          name: existingCategory.name,
          group: existingCategory.group
        } : null
      }
    };
  } catch (error) {
    console.error("Failed to check category name availability:", error);
    return { success: false, error: "Failed to check name availability" };
  }
}

// Create category with duplicate check and ordering
export async function createCategoryEnhanced(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const group = formData.get("group") as CategoryGroup;
    const color = formData.get("color") as string || "#6366F1";
    const icon = formData.get("icon") as string || "tag";
    const isArchived = formData.get("isArchived") === "true";

    // Check for duplicate name
    const nameCheck = await checkCategoryNameAvailability(name);
    if (!nameCheck.success || !nameCheck.data?.available) {
      return { 
        success: false, 
        error: `Category "${name}" already exists. Please choose a different name.`,
        fieldErrors: { name: ["Category name must be unique"] }
      };
    }

    // Validate form data
    const validatedFields = categorySchema.safeParse({
      name,
      group,
      color,
      icon,
      isArchived: isArchived || false
    });

    if (!validatedFields.success) {
      console.error("Validation errors:", validatedFields.error.flatten());
      return {
        success: false,
        error: "Invalid form data",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const user = await getDefaultUser();

    // Get the highest order in this group for the user
    const maxOrder = await prisma.category.aggregate({
      where: {
        userId: user.id,
        group: group
      },
      _max: {
        order: true
      }
    });

    const nextOrder = (maxOrder._max.order || 0) + 1;

    // Create the category
    const category = await prisma.category.create({
      data: {
        ...validatedFields.data,
        order: nextOrder,
        userId: user.id,
      },
    });

    // Revalidate all relevant paths
    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/stats");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: category,
      message: "Category created successfully"
    };
  } catch (error) {
    console.error("Failed to create category:", error);
    return {
      success: false,
      error: "Failed to create category"
    };
  }
}

// Simple test function to verify server actions are working
export async function testServerAction() {
  console.log('🚀 TEST SERVER ACTION CALLED 🚀');
  return { success: true, message: 'Server actions are working!' };
}

// Simplified update function for testing
export async function updateCategoryEnhancedSimple(id: string, formData: FormData) {
  console.log('🔥🔥🔥 SIMPLE UPDATE FUNCTION CALLED 🔥🔥🔥');
  console.log('🔥🔥🔥 ID:', id);
  console.log('🔥🔥🔥 FormData entries:', Array.from(formData.entries()));
  
  return { success: true, message: 'Simple update works!' };
}

// Update category with duplicate check
export async function updateCategoryEnhanced(id: string, formData: FormData) {
  console.log('🔥🔥🔥 UPDATE CATEGORY FUNCTION CALLED - MINIMAL VERSION 🔥🔥🔥');
  console.log('🔥🔥🔥 ID:', id);
  console.log('🔥🔥🔥 FormData entries:', Array.from(formData.entries()));
  
  try {
    // Extract form data
    const name = formData.get("name") as string;
    const rawGroup = formData.get("group") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;
    const isArchived = formData.get("isArchived") === "true";

    console.log('🔥🔥🔥 Extracted data:', { name, rawGroup, color, icon, isArchived });

    // Get the user (now fixed)
    const user = await getDefaultUser();
    console.log('🔥🔥🔥 User ID:', user.id);

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingCategory) {
      console.log('🔥🔥🔥 Category not found or does not belong to user');
      return { 
        success: false, 
        error: "Category not found" 
      };
    }

    console.log('🔥🔥🔥 Existing category found:', existingCategory);

    // Validate group is a valid CategoryGroup
    const validGroups = Object.values(CategoryGroup);
    const group = validGroups.includes(rawGroup as CategoryGroup) ? rawGroup as CategoryGroup : CategoryGroup.OTHER;
    
    console.log('🔥🔥🔥 Validated group:', group);

    // Prepare update data
    const updateData = {
      name: name.trim(),
      group,
      color: color.trim(),
      icon: icon.trim(),
      isArchived,
    };

    console.log('🔥🔥🔥 Update data prepared:', updateData);

    // Update category in database
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    console.log('🔥🔥🔥 Updated category in database:', updatedCategory);

    // Revalidate paths
    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/stats");
    revalidatePath("/dashboard");
    
    console.log('🔥🔥🔥 Paths revalidated, ABOUT TO REDIRECT 🔥🔥🔥');
    
    // Redirect back to categories list
    redirect("/categories");
  } catch (error) {
    // Check if this is a redirect error (which is expected behavior)
    if (error instanceof Error && 
        (error.message.includes('NEXT_REDIRECT') || 
         error.name === 'NEXT_REDIRECT' ||
         (error as any).digest?.startsWith('NEXT_REDIRECT'))) {
      // This is a redirect error, which means success - don't treat as failure
      throw error; // Re-throw to allow redirect to work
    }
    
    console.error('🔥🔥🔥 UPDATE CATEGORY ERROR 🔥🔥🔥');
    console.error(`Failed to update category ${id}:`, error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Not an Error');
    console.error('=== END UPDATE CATEGORY ERROR ===');
    
    return {
      success: false,
      error: "Failed to update category"
    };
  }
}

// Archive/unarchive category with usage check
export async function toggleCategoryArchiveStatusEnhanced(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true
          }
        }
      }
    });
    
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    const hasUsage = category._count.transactions > 0 || category._count.budgets > 0;
    
    // If trying to unarchive, just do it
    if (category.isArchived) {
      await prisma.category.update({
        where: { id },
        data: { isArchived: false }
      });
      
      revalidatePath("/categories");
      revalidatePath("/transactions");
      revalidatePath("/budgets");
      revalidatePath("/stats");
      revalidatePath("/dashboard");
      
      return { 
        success: true, 
        message: "Category restored successfully" 
      };
    }

    // If trying to archive and has usage, confirm
    if (hasUsage) {
      await prisma.category.update({
        where: { id },
        data: { isArchived: true }
      });
      
      revalidatePath("/categories");
      revalidatePath("/transactions");
      revalidatePath("/budgets");
      revalidatePath("/stats");
      revalidatePath("/dashboard");
      
      return { 
        success: true, 
        message: "Category archived successfully" 
      };
    }

    // If no usage, allow hard delete
    await prisma.category.delete({
      where: { id }
    });
    
    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/stats");
    revalidatePath("/dashboard");
    
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error(`Failed to update archive status for category ${id}:`, error);
    return { success: false, error: "Failed to update category" };
  }
}

// Reorder categories within a group
export async function reorderCategories(categoryIds: string[]) {
  try {
    const user = await getDefaultUser();
    
    // Verify all categories belong to the user
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        userId: user.id
      }
    });

    if (categories.length !== categoryIds.length) {
      return { success: false, error: "Some categories not found" };
    }

    // Update order for each category
    const updatePromises = categoryIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { order: index }
      })
    );

    await Promise.all(updatePromises);

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true, message: "Categories reordered successfully" };
  } catch (error) {
    console.error("Failed to reorder categories:", error);
    return { success: false, error: "Failed to reorder categories" };
  }
}

// Reset to default categories
export async function resetToDefaultCategories() {
  try {
    const user = await getDefaultUser();

    const defaultCategories = [
      // INCOME
      { name: "Salary", group: "INCOME" as CategoryGroup, color: "#10B981", icon: "briefcase" },
      { name: "Freelance", group: "INCOME" as CategoryGroup, color: "#10B981", icon: "laptop" },
      { name: "Investments", group: "INCOME" as CategoryGroup, color: "#10B981", icon: "trending-up" },
      { name: "Other Income", group: "INCOME" as CategoryGroup, color: "#10B981", icon: "plus-circle" },
      
      // NEEDS
      { name: "Housing", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "home" },
      { name: "Utilities", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "zap" },
      { name: "Groceries", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "shopping-cart" },
      { name: "Transportation", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "car" },
      { name: "Healthcare", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "heart" },
      { name: "Insurance", group: "NEEDS" as CategoryGroup, color: "#EF4444", icon: "shield" },
      
      // WANTS
      { name: "Dining Out", group: "WANTS" as CategoryGroup, color: "#F59E0B", icon: "utensils" },
      { name: "Entertainment", group: "WANTS" as CategoryGroup, color: "#F59E0B", icon: "film" },
      { name: "Shopping", group: "WANTS" as CategoryGroup, color: "#F59E0B", icon: "shopping-bag" },
      { name: "Travel", group: "WANTS" as CategoryGroup, color: "#F59E0B", icon: "plane" },
      { name: "Hobbies", group: "WANTS" as CategoryGroup, color: "#F59E0B", icon: "palette" },
      
      // SAVINGS
      { name: "Emergency Fund", group: "SAVINGS" as CategoryGroup, color: "#3B82F6", icon: "shield-check" },
      { name: "Retirement", group: "SAVINGS" as CategoryGroup, color: "#3B82F6", icon: "piggy-bank" },
      { name: "Investments", group: "SAVINGS" as CategoryGroup, color: "#3B82F6", icon: "chart-line" },
      { name: "Savings Goals", group: "SAVINGS" as CategoryGroup, color: "#3B82F6", icon: "target" },
      
      // DEBT
      { name: "Credit Card", group: "DEBT" as CategoryGroup, color: "#8B5CF6", icon: "credit-card" },
      { name: "Student Loans", group: "DEBT" as CategoryGroup, color: "#8B5CF6", icon: "graduation-cap" },
      { name: "Car Loan", group: "DEBT" as CategoryGroup, color: "#8B5CF6", icon: "car" },
      { name: "Personal Loan", group: "DEBT" as CategoryGroup, color: "#8B5CF6", icon: "users" },
    ];

    // Get existing categories to avoid duplicates
    const existingCategories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { name: true, group: true }
    });

    const existingNames = new Set(existingCategories.map(cat => `${cat.name}-${cat.group}`));

    // Create missing default categories
    const categoriesToCreate = defaultCategories.filter(defaultCat => 
      !existingNames.has(`${defaultCat.name}-${defaultCat.group}`)
    );

    if (categoriesToCreate.length === 0) {
      return { success: true, message: "All default categories already exist" };
    }

    // Get current orders for each group
    const groupOrders = await prisma.category.groupBy({
      by: ['group'],
      where: { userId: user.id },
      _max: { order: true }
    });

    const orderMap = new Map(
      groupOrders.map(go => [go.group, go._max.order || 0])
    );

    // Create categories with proper ordering
    const createPromises = categoriesToCreate.map((category, index) => {
      const currentOrder = (orderMap.get(category.group) || 0) + 1;
      orderMap.set(category.group, currentOrder);

      return prisma.category.create({
        data: {
          ...category,
          order: currentOrder,
          userId: user.id,
        }
      });
    });

    await Promise.all(createPromises);

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/stats");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      message: `Created ${categoriesToCreate.length} default categories` 
    };
  } catch (error) {
    console.error("Failed to reset to default categories:", error);
    return { success: false, error: "Failed to create default categories" };
  }
}

// Get category usage info
export async function getCategoryUsage(id: string) {
  try {
    const usage = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true
          }
        }
      }
    });

    if (!usage) {
      return { success: false, error: "Category not found" };
    }

    return {
      success: true,
      data: {
        transactionCount: usage._count.transactions,
        budgetCount: usage._count.budgets,
        hasUsage: usage._count.transactions > 0 || usage._count.budgets > 0
      }
    };
  } catch (error) {
    console.error("Failed to get category usage:", error);
    return { success: false, error: "Failed to get category usage" };
  }
}
