"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { ChartTooltip } from '@/components/charts/mobile-tooltip';

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

interface MonthlyChartProps {
  data: MonthlyData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280} className="md:h-[350px]">
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={60}
          fontSize={12}
        />
        <YAxis 
          tickFormatter={(value) => {
            if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
            return `$${value}`;
          }}
          fontSize={12}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#4CAF50" />
        <Bar dataKey="expenses" name="Expenses" fill="#F44336" />
        <Bar dataKey="savings" name="Savings" fill="#2196F3" />
      </BarChart>
    </ResponsiveContainer>
  );
}
