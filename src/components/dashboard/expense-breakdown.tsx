"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
};

interface ExpenseBreakdownProps {
  categories: ExpenseCategory[];
}

export function ExpenseBreakdown({ categories }: ExpenseBreakdownProps) {
  // Ensure categories array is not empty to avoid errors in Recharts
  if (!categories || categories.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <p className="text-muted-foreground">No expense data available</p>
      </div>
    );
  }

  // Custom tooltip to show amount and percentage
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 shadow-md rounded-md border">
          <p className="font-medium">{data.name}</p>
          <p>Amount: ${data.amount.toFixed(2)}</p>
          <p>Percentage: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={categories}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="amount"
          nameKey="name"
          label={({ name, percent }: any) => {
            const percentage = ((percent || 0) * 100).toFixed(1);
            const displayName = (name || '').length > 12 ? (name || '').substring(0, 12) + "..." : (name || '');
            return `${displayName}: ${percentage}%`;
          }}
          fontSize={10}
        >
          {categories.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
