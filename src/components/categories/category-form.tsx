"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CategoryGroup } from "@prisma/client";
import * as Icons from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createCategoryEnhanced, updateCategoryEnhanced, updateCategoryEnhancedSimple, testServerAction } from "@/lib/actions/category-actions-enhanced";
import { toast } from "sonner";

// Define the form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.nativeEnum(CategoryGroup),
  color: z.string().default("#6366F1"),
  icon: z.string().default("tag"),
  isArchived: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    group: CategoryGroup;
    color: string;
    icon: string;
    isArchived: boolean;
    userId: string;
  };
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
};

// Category group options for the dropdown
const categoryGroupOptions = [
  { value: "INCOME", label: "Income" },
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
  { value: "DEBT", label: "Debt" },
  { value: "OTHER", label: "Other" },
];

// Common icons for categories with display names
const commonIcons = [
  "Tag", "ShoppingBag", "Home", "Car", "Utensils", "Coffee", 
  "Gift", "Heart", "CreditCard", "DollarSign", "Briefcase", 
  "Book", "Film", "Music", "Phone", "Wifi", "Zap", "Shield", 
  "Activity", "AlertCircle", "Award", "BatteryCharging", "Bell", 
  "Bluetooth", "Box", "Camera", "Cast", "Clipboard", "Cloud",
  "Codepen", "Codesandbox", "Database", "Disc", "Download",
  "Droplet", "Feather", "File", "Flag", "Folder", "Github", "Globe",
  "Grid", "HardDrive", "Hash", "Headphones", "Instagram", "Layers",
  "Layout", "LifeBuoy", "Link", "Linkedin", "Map", "MapPin", "MessageCircle",
  "Mic", "Monitor", "Moon", "Paperclip", "PenTool", "Percent", "PieChart",
  "Play", "PlusSquare", "Pocket", "Power", "RefreshCw", "Repeat", "Save",
  "Scissors", "Search", "Server", "Settings", "Share2", "ShoppingCart",
  "Shuffle", "Slack", "Smartphone", "Speaker", "Star", "Sun", "Sunrise",
  "Sunset", "Tablet", "Target", "Terminal", "Thermometer", "ThumbsUp", "Tool",
  "Trash2", "Tv", "Twitter", "Umbrella", "Upload", "User", "Users",
  "Video", "Watch", "Wind", "Youtube", "ZoomIn"
];

// Function to render icon by name
const renderIcon = (name: string) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className="h-4 w-4" />;
};

// Some predefined colors for categories
const predefinedColors = [
  "#f44336", // Red
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#673ab7", // Deep Purple
  "#3f51b5", // Indigo
  "#2196f3", // Blue
  "#03a9f4", // Light Blue
  "#00bcd4", // Cyan
  "#009688", // Teal
  "#4caf50", // Green
  "#8bc34a", // Light Green
  "#cddc39", // Lime
  "#ffeb3b", // Yellow
  "#ffc107", // Amber
  "#ff9800", // Orange
  "#ff5722", // Deep Orange
  "#795548", // Brown
  "#9e9e9e", // Grey
];

export function CategoryForm({ category, mode, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIcon, setSelectedIcon] = useState<string>("tag");

  // Default values for the form
  const defaultValues = category
    ? {
        name: category.name,
        group: category.group,
        color: category.color,
        icon: category.icon,
        isArchived: category.isArchived,
      }
    : {
        name: "",
        group: "NEEDS" as CategoryGroup,
        color: predefinedColors[0],
        icon: "tag",
        isArchived: false,
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  // Update selected icon when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'icon' && value.icon) {
        setSelectedIcon(value.icon as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = (values: FormValues) => {
    console.log('=== CLIENT SIDE FORM SUBMISSION ===');
    console.log('Mode:', mode);
    console.log('Values:', values);
    
    startTransition(async () => {
      try {
        if (mode === "create") {
          console.log('Creating new category...');
          const formData = new FormData();
          formData.append("name", values.name);
          formData.append("group", values.group);
          formData.append("color", values.color);
          formData.append("icon", values.icon);
          formData.append("isArchived", "false"); // New categories are never archived

          const result = await createCategoryEnhanced(formData);
          console.log('Create result:', result);
          
          if (result.success) {
            toast.success("Category created successfully");
            onSuccess?.();
            return;
          } else {
            toast.error(result.error || "Failed to create category");
            return;
          }
        } else if (mode === "edit" && category) {
          console.log('Updating existing category...');
          console.log('Category ID:', category.id);
          
          // Test server action first
          console.log('Testing server action...');
          const testResult = await testServerAction();
          console.log('Test result:', testResult);
          
          const formData = new FormData();
          formData.append("name", values.name);
          formData.append("group", values.group);
          formData.append("color", values.color);
          formData.append("icon", values.icon);
          formData.append("isArchived", values.isArchived.toString());

          console.log('About to call updateCategoryEnhancedSimple...');
          const result = await updateCategoryEnhancedSimple(category.id, formData);
          console.log('Simple update result:', result);
          
          // Also try the original function
          console.log('About to call original updateCategoryEnhanced...');
          try {
            const originalResult = await updateCategoryEnhanced(category.id, formData);
            console.log('Original update result:', originalResult);
            
            // If we get here, it means the function returned instead of redirecting
            if (originalResult.success) {
              toast.success("Category updated successfully");
              onSuccess?.();
              return;
            } else {
              console.log('Update failed:', originalResult.error);
              toast.error(originalResult.error || "Failed to update category");
              return;
            }
          } catch (redirectError) {
            // Server action redirected - this is expected behavior
            console.log('Server action redirected successfully');
            toast.success("Category updated successfully");
            onSuccess?.();
            return;
          }
        }
        
        // Call success callback if provided
        onSuccess?.();
      } catch (error) {
        console.error('=== CLIENT SIDE ERROR ===');
        console.error("Failed to save category:", error);
        toast.error("Failed to save category");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Group</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryGroupOptions.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Icon {field.value && <span className="ml-2">{renderIcon(field.value)}</span>}
              </FormLabel>
              <FormControl>
                <ScrollArea className="h-72 border rounded-md p-2">
                  <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                    {commonIcons.map((icon) => (
                      <div
                        key={icon}
                        className={`flex items-center justify-center h-10 w-10 rounded-md cursor-pointer hover:bg-muted ${
                          field.value === icon ? "bg-primary/20 ring-2 ring-primary" : ""
                        }`}
                        onClick={() => field.onChange(icon)}
                        title={icon}
                      >
                        {renderIcon(icon)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map((color) => (
                  <div
                    key={color}
                    className={`h-8 w-8 rounded-full cursor-pointer ${
                      field.value === color ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => field.onChange(color)}
                  />
                ))}
                <FormControl>
                  <Input
                    type="color"
                    className="h-8 w-8 p-0 cursor-pointer"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "edit" && (
          <FormField
            control={form.control}
            name="isArchived"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mt-0">Archived</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create Category" : "Update Category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.push("/categories"))}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
