'use client';

import React, { useMemo, useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserX,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Printer,
  DollarSign,
  Clock,
  UserMinus,
  BookOpen,
  MapPin,
  Building2,
  Calendar,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StudentCard } from '@/components/students';
import type {
  Class,
  ClassStatus,
  Course,
  Room,
  Instructor,
  Company,
  Student,
  ExtraProduct,
  User,
} from '@/types';
import { getClassStatusBadgeClass } from '@/types';

// ============================================
// TYPES
// ============================================

interface ClassDetailsPanelProps {
  selectedClass: Class;
  courses: Course[];
  rooms: Room[];
  companies: Company[];
  instructors: Instructor[];
  students: Student[];
  extraProducts?: ExtraProduct[];
  users?: User[];
  currentUser?: User;
  highlightedStudentId?: string | null;
  onClose: () => void;
  // Dialog handlers
  onOpenAttendance: () => void;
  onOpenWaitingList: () => void;
  onOpenScheduleExam: () => void;
  onOpenAddInstructor: () => void;
  onOpenReport: () => void;
  onOpenPaymentOverview: () => void;
  onOpenInstructorExams: (instructorId: string) => void;
  onOpenInstructorCosts: (instructorId: string) => void;
  onOpenEnrollment: () => void;
  onConfirmInstructorAttendance?: (instructorId: string, date: string) => void;
  onRemoveInstructorFromClass?: (instructorId: string) => void;
  // Student actions
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onMarkDayAttendance?: (studentId: string, date: string) => void;
  onTransferStudent?: (studentId: string) => void;
  onReplaceStudent?: (studentId: string) => void;
  className?: string;
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function buildWhatsAppWebUrl(phone?: string, message?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  const baseUrl = `https://web.whatsapp.com/send?phone=${number}`;
  const text = message?.trim();
  if (!text) return baseUrl;
  return `${baseUrl}&text=${encodeURIComponent(text)}`;
}

// ============================================
// COMPONENT
// ============================================

export function ClassDetailsPanel({
  selectedClass,
  courses,
  rooms,
  companies,
  instructors,
  students,
  extraProducts = [],
  users = [],
  currentUser,
  highlightedStudentId,
  onClose,
  onOpenAttendance,
  onOpenWaitingList,
  onOpenScheduleExam,
  onOpenAddInstructor,
  onOpenReport,
  onOpenPaymentOverview,
  onOpenInstructorExams,
  onOpenInstructorCosts,
  onOpenEnrollment,
  onConfirmInstructorAttendance,
  onRemoveInstructorFromClass,
  onUpdateStudent,
  onDeleteStudent,
  onMarkDayAttendance,
  onTransferStudent,
  onReplaceStudent,
  className,
}: ClassDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('alunos');
  const [showInstructorSection, setShowInstructorSection] = useState(true);
  const [instructorToRemove, setInstructorToRemove] = useState<Instructor | null>(null);
  const todayKey = new Date().toISOString().split('T')[0];

  const course = useMemo(
    () => courses.find((c) => c.id === selectedClass.courseId),
    [courses, selectedClass.courseId]
  );

  const room = useMemo(
    () => rooms.find((r) => r.id === selectedClass.roomId),
    [rooms, selectedClass.roomId]
  );

  const company = useMemo(
    () => companies.find((c) => c.id === selectedClass.companyId),
    [companies, selectedClass.companyId]
  );

  // Filter students by status
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClass.id);
  }, [students, selectedClass.id]);

  const activeStudents = useMemo(
    () => classStudents.filter((s) => s.status === 'Active'),
    [classStudents]
  );

  const waitingStudents = useMemo(
    () => classStudents.filter((s) => s.status === 'WaitingList'),
    [classStudents]
  );

  const replacedStudents = useMemo(
    () => classStudents.filter((s) => s.status === 'Replaced'),
    [classStudents]
  );

  // Class instructors - extract from ClassInstructor array
  const classInstructors = useMemo(() => {
    if (!selectedClass.instructors?.length) return [];
    const instructorIds = selectedClass.instructors.map((ci) => ci.instructorId);
    return instructors.filter((i) => instructorIds.includes(i.id));
  }, [instructors, selectedClass.instructors]);

  const instructorAttendanceById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (selectedClass.instructors || []).forEach((item) => {
      map.set(
        item.instructorId,
        new Set(item.attendances?.map((attendance) => attendance.date) || [])
      );
    });
    return map;
  }, [selectedClass.instructors]);

  return (
    <div className={className || 'col-span-12 lg:col-span-3 space-y-4'}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {selectedClass.code}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Class Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {selectedClass.displayName || course?.name}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${getClassStatusBadgeClass(selectedClass.status)}`}
              >
                {selectedClass.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatDate(selectedClass.startDate)} - {formatDate(selectedClass.endDate)}
              </div>
              {room && (
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {room.name}
                </div>
              )}
              {company && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Building2 className="w-3 h-3" />
                  {company.name}
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="w-3 h-3" />
                {activeStudents.length}/{selectedClass.maxStudents} alunos
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {course?.hoursPerDay || 8}h/dia
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <BookOpen className="w-3 h-3" />
                {course?.duration || 40}h total
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] col-span-2"
              onClick={onOpenEnrollment}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Nova Matricula
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={onOpenAttendance}
            >
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Presença
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={onOpenWaitingList}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Lista Espera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={onOpenScheduleExam}
            >
              <FileText className="w-3 h-3 mr-1" />
              Agendar Prova
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={onOpenReport}
            >
              <Printer className="w-3 h-3 mr-1" />
              Relatório
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] col-span-2"
              onClick={onOpenPaymentOverview}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Visão Financeira
            </Button>
          </div>

          {/* Instructors Section */}
          <div className="border-t pt-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowInstructorSection(!showInstructorSection)}
            >
              <span className="text-xs font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                Instrutores ({classInstructors.length})
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showInstructorSection ? 'rotate-180' : ''
                }`}
              />
            </div>

            {showInstructorSection && (
              <div className="mt-2 space-y-1">
                {classInstructors.length === 0 ? (
                  <p className="text-[10px] text-gray-500">Nenhum instrutor atribuído</p>
                ) : (
                  classInstructors.map((instructor) => {
                    const whatsappMessage = `Olá ${instructor.name}, tudo bem? Aqui é da Caiso sobre a turma ${selectedClass.code}.`;
                    const whatsappUrl = buildWhatsAppWebUrl(instructor.phone, whatsappMessage);

                    return (
                    <div key={instructor.id} className="flex items-center justify-between bg-gray-50 rounded p-1">
                      <span className="text-[10px]">{instructor.name}</span>
                      <div className="flex gap-1">
                        {onConfirmInstructorAttendance && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[9px] px-1"
                            onClick={() =>
                              onConfirmInstructorAttendance(instructor.id, todayKey)
                            }
                            disabled={instructorAttendanceById
                              .get(instructor.id)
                              ?.has(todayKey)}
                          >
                            {instructorAttendanceById.get(instructor.id)?.has(todayKey)
                              ? 'Presente'
                              : 'Presenca'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] px-1"
                          onClick={() => onOpenInstructorExams(instructor.id)}
                        >
                          Provas
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] px-1"
                          onClick={() => onOpenInstructorCosts(instructor.id)}
                        >
                          Custos
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] px-1"
                          onClick={() => {
                            if (!whatsappUrl) return;
                            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                          }}
                          disabled={!whatsappUrl}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                        {onRemoveInstructorFromClass && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[9px] px-1 text-red-600 hover:text-red-700"
                            onClick={() => setInstructorToRemove(instructor)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 text-[10px]"
                  onClick={onOpenAddInstructor}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Adicionar Instrutor
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Tabs */}
      <Card>
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="alunos" className="text-[10px] flex-1">
                <Users className="w-3 h-3 mr-1" />
                Alunos ({activeStudents.length})
              </TabsTrigger>
              <TabsTrigger value="espera" className="text-[10px] flex-1">
                <Clock className="w-3 h-3 mr-1" />
                Espera ({waitingStudents.length})
              </TabsTrigger>
              <TabsTrigger value="substituidos" className="text-[10px] flex-1">
                <UserMinus className="w-3 h-3 mr-1" />
                Subst. ({replacedStudents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alunos" className="mt-2 space-y-2 max-h-[500px] overflow-y-auto">
              {activeStudents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Nenhum aluno matriculado</p>
              ) : (
                activeStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    classData={selectedClass}
                    instructors={classInstructors}
                    extraProducts={extraProducts}
                    users={users}
                    companies={companies}
                    currentUser={currentUser}
                    onUpdateStudent={onUpdateStudent}
                    onDeleteStudent={onDeleteStudent}
                    onMarkDayAttendance={onMarkDayAttendance}
                    onTransferStudent={onTransferStudent}
                    onReplaceStudent={onReplaceStudent}
                    compact
                    highlighted={student.id === highlightedStudentId}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="espera" className="mt-2 space-y-2 max-h-[500px] overflow-y-auto">
              {waitingStudents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Lista de espera vazia</p>
              ) : (
                waitingStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    classData={selectedClass}
                    instructors={classInstructors}
                    extraProducts={extraProducts}
                    users={users}
                    companies={companies}
                    currentUser={currentUser}
                    onUpdateStudent={onUpdateStudent}
                    onDeleteStudent={onDeleteStudent}
                    onMarkDayAttendance={onMarkDayAttendance}
                    onTransferStudent={onTransferStudent}
                    compact
                    highlighted={student.id === highlightedStudentId}
                    showWaitingPosition
                  />
                ))
              )}
            </TabsContent>

            <TabsContent
              value="substituidos"
              className="mt-2 space-y-2 max-h-[500px] overflow-y-auto"
            >
              {replacedStudents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Nenhum aluno substituído</p>
              ) : (
                replacedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    classData={selectedClass}
                    instructors={classInstructors}
                    extraProducts={extraProducts}
                    users={users}
                    companies={companies}
                    currentUser={currentUser}
                    onUpdateStudent={onUpdateStudent}
                    onDeleteStudent={onDeleteStudent}
                    onMarkDayAttendance={onMarkDayAttendance}
                    onTransferStudent={onTransferStudent}
                    compact
                    highlighted={student.id === highlightedStudentId}
                    disabled
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!instructorToRemove}
        onOpenChange={(open) => {
          if (!open) setInstructorToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover instrutor da turma?</AlertDialogTitle>
            <AlertDialogDescription>
              {instructorToRemove
                ? `Esta ação remove ${instructorToRemove.name} desta turma e impacta presenças/provas vinculadas.`
                : 'Esta ação remove o instrutor desta turma.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!instructorToRemove || !onRemoveInstructorFromClass) return;
                onRemoveInstructorFromClass(instructorToRemove.id);
                setInstructorToRemove(null);
              }}
            >
              Confirmar remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
