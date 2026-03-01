"use client";

import { useRouter, usePathname } from "next/navigation";

interface MonthFilterProps {
  defaultValue: string;
}

export function MonthFilter({ defaultValue }: MonthFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    const url = newMonth ? `${pathname}?month=${newMonth}` : pathname;
    router.push(url);
  };

  return (
    <input 
      type="month" 
      className="rounded-md border px-3 py-2 text-sm" 
      defaultValue={defaultValue}
      onChange={handleChange}
    />
  );
}
