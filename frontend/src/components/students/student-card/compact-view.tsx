'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import type { Student, ExtraProduct } from '@/types';
import { calculateEnrollmentProgress, checkDocumentsComplete } from './utils';

interface CompactViewProps {
  student: Student;
  extraProducts?: ExtraProduct[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode; // Status buttons & WhatsApp
}

/**
 * Compact view header for StudentCard
 * Shows photo, name, products, progress and status controls
 */
export const CompactView: React.FC<CompactViewProps> = ({
  student,
  extraProducts = [],
  isExpanded,
  onToggleExpand,
  children,
}) => {
  // Resolve product names from IDs
  const getProductNames = (): string => {
    const productIds = student.extraProductIds || [];
    return productIds
      .map((id) => extraProducts.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(' • ');
  };

  const documentsComplete = checkDocumentsComplete(student);
  const progress = calculateEnrollmentProgress(student, documentsComplete);

  return (
    <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
      <div className="flex items-center gap-3">
        {/* Photo */}
        <div className="relative shrink-0">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name and Products */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">
            {student.name}
          </h3>

          {/* Extra products */}
          {student.extraProductIds && student.extraProductIds.length > 0 && (
            <div className="text-sm text-gray-600 mt-0.5 truncate">
              {getProductNames()}
            </div>
          )}
        </div>

        {/* Expand toggle icon */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-600 font-medium">Progresso</span>
            <span className="text-[10px] text-gray-600 font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Status controls slot */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
