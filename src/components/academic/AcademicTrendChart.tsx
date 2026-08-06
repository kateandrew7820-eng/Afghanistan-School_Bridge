import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface TrendPoint {
  label: string;
  value: number;
}

interface AcademicTrendChartProps {
  title: string;
  data: TrendPoint[];
  description?: string;
}

export default function AcademicTrendChart({ title, data, description }: AcademicTrendChartProps) {
  if (!data.length) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        <p className="text-sm text-muted-foreground mt-4">No trend data available yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
