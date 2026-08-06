import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AcademicStatusBadgeProps {
  status: 'excellent' | 'good' | 'needs-attention' | 'at-risk';
}

const variants = {
  excellent: 'success',
  good: 'info',
  'needs-attention': 'warning',
  'at-risk': 'destructive',
} as const;

const labels = {
  excellent: 'Excellent',
  good: 'Good',
  'needs-attention': 'Needs attention',
  'at-risk': 'At risk',
} as const;

export default function AcademicStatusBadge({ status }: AcademicStatusBadgeProps) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
