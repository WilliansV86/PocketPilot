"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { createCategory, updateCategory } from "@/lib/actions/category-actions";
import { toast } from "sonner";

// Define the form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.enum(["NECESSITIES", "WANTS", "SAVINGS_DEBT", "INCOME"]),
  color: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryGroupFormProps = {
  categoryGroup?: {
    id: string;
    name: string;
    group: string;
    color?: string | null;
  };
  mode: "create" | "edit";
};

// Category types for the dropdown
const categoryTypes = [
  { value: "NECESSITIES", label: "Necessities" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS_DEBT", label: "Savings & Debt" },
  { value: "INCOME", label: "Income" },
];

// Some predefined colors for category groups
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

export function CategoryGroupForm({ categoryGroup, mode }: CategoryGroupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default values for the form
  const defaultValues = categoryGroup
    ? {
        name: categoryGroup.name,
        group: categoryGroup.group as "NECESSITIES" | "WANTS" | "SAVINGS_DEBT" | "INCOME",
        color: categoryGroup.color || predefinedColors[0],
      }
    : {
        name: "",
        group: "WANTS" as const,
        color: predefinedColors[0],
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("group", values.group);
        if (values.color) formData.append("color", values.color);

        if (mode === "create") {
          await createCategory(formData);
          toast.success("Category created successfully");
        } else if (mode === "edit" && categoryGroup) {
          await updateCategory(categoryGroup.id, formData);
          toast.success("Category updated successfully");
        }
        
        // Navigate back to categories list
        router.push("/categories");
        router.refresh();
      } catch (error) {
        console.error("Failed to save category group:", error);
        toast.error("Failed to save category group");
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Living Expenses" {...field} />
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
              <FormLabel>Group</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create Group" : "Update Group"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/categories")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
