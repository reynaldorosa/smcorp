'use client';

import React from 'react';
import { StudentCard } from '@/components/students';
import type { Student, Class, Course, Instructor, ExtraProduct, User, Company } from '@/types';

// ============================================
// TYPES
// ============================================

interface StudentGridProps {
  students: Student[];
  course?: Course;
  classData: Class;
  // Reference data
  instructors?: Instructor[];
  extraProducts?: ExtraProduct[];
  users?: User[];
  companies?: Company[];
  currentUser?: User;
  // Callbacks
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onMarkDayAttendance?: (studentId: string, date: string) => void;
  onTransferStudent?: (studentId: string) => void;
  // Display options
  compact?: boolean;
  currentDate?: string;
  emptyMessage?: string;
}

// ============================================
// COMPONENT
// ============================================

export function StudentGrid({
  students,
  course,
  classData,
  instructors = [],
  extraProducts = [],
  users = [],
  companies = [],
  currentUser,
  onUpdateStudent,
  onDeleteStudent,
  onMarkDayAttendance,
  onTransferStudent,
  compact = false,
  currentDate,
  emptyMessage = 'Nenhum aluno encontrado',
}: StudentGridProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          course={course}
          classData={classData}
          compact={compact}
          currentDate={currentDate}
          instructors={instructors}
          extraProducts={extraProducts}
          users={users}
          companies={companies}
          currentUser={currentUser}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={onDeleteStudent}
          onMarkDayAttendance={onMarkDayAttendance}
          onTransferStudent={onTransferStudent}
        />
      ))}
    </div>
  );
}
