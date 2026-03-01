"use client";

interface SimpleMonthFilterProps {
  defaultValue: string;
}

export function SimpleMonthFilter({ defaultValue }: SimpleMonthFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    window.location.href = newMonth ? `/transactions?month=${newMonth}` : '/transactions';
  };

  return (
    <input 
      type="month" 
      defaultValue={defaultValue}
      onChange={handleChange}
      style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
    />
  );
}
