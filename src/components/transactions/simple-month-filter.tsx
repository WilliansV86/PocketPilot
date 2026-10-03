"use client";

interface SimpleMonthFilterProps {
  defaultValue: string;
}

export function SimpleMonthFilter({ defaultValue }: SimpleMonthFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set("month", newMonth || "all");
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
  };

  return (
    <input 
      type="month" 
      value={defaultValue}
      onChange={handleChange}
      style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
    />
  );
}
