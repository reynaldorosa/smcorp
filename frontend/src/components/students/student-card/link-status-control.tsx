'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student, LinkStatus } from '@/types';
import { getLinkStatusStyle } from './utils';

// UI Labels in Portuguese
const LINK_STATUS_UI: Record<LinkStatus, { emoji: string; label: string }> = {
  Scheduled: { emoji: '🟡', label: 'Agendado' },
  ToConfirm: { emoji: '🟠', label: 'Confirmar' },
  Confirmed: { emoji: '🔵', label: 'Confirmado' },
  Present: { emoji: '🟢', label: 'Presente' },
};

interface LinkStatusControlProps {
  student: Student;
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
}

/**
 * Link status dropdown for list view
 * Allows changing student enrollment status
 */
export const LinkStatusControl: React.FC<LinkStatusControlProps> = ({
  student,
  onUpdateStudent,
}) => {
  const status = student.linkStatus || 'Scheduled';
  const statusStyle = getLinkStatusStyle(status);
  const currentStatus = LINK_STATUS_UI[status];

  return (
    <>
      <span className="text-[10px] text-gray-600 font-medium block mb-1">Status</span>
      <Select
        value={status}
        onValueChange={(value) =>
          onUpdateStudent?.(student.id, { linkStatus: value as LinkStatus })
        }
      >
        <SelectTrigger className={`h-7 text-xs w-full ${statusStyle}`}>
          <SelectValue>
            {currentStatus?.emoji} {currentStatus?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LINK_STATUS_UI).map(([key, { emoji, label }]) => (
            <SelectItem key={key} value={key}>
              {emoji} {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};
