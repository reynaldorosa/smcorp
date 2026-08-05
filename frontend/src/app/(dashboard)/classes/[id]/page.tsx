'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileSpreadsheet,
  MapPin,
  Plus,
  Users,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentCard } from '@/components/students';
import { AddStudentDialog, UploadSpreadsheetDialog } from '@/components/dialogs';
import { ClassFormDialog } from '@/components/classes/class-form-dialog';
import { AddWaitingListDialog } from '@/components/classes/add-waiting-list-dialog';
import { useClassesStore } from '@/stores/classes.store';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { CLASS_STATUS_LABELS } from '@/types';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function cleanTaxId(value: string): string {
  return value.replace(/\D/g, '');
}

export default function ClassDetailsPage() {
  const params = useParams<{ id: string }>();
  const classId = params?.id;

  const { classes } = useClassesStore();
  const { students, addStudent, updateStudent, deleteStudent } = useStudentsStore();
  const { courses } = useCoursesStore();
  const { rooms, instructors, extraProducts, users, currentUser, emailConfig, whatsappConfig } = useSettingsStore();
  const { companies } = useCompaniesStore();

  const classItem = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId]
  );

  const course = useMemo(
    () => courses.find((item) => item.id === classItem?.courseId),
    [courses, classItem?.courseId]
  );

  const room = useMemo(
    () => rooms.find((item) => item.id === classItem?.roomId),
    [rooms, classItem?.roomId]
  );

  const company = useMemo(
    () => companies.find((item) => item.id === classItem?.companyId),
    [companies, classItem?.companyId]
  );

  const classStudents = useMemo(
    () => students.filter((student) => student.classId === classId),
    [students, classId]
  );

  const stats = useMemo(() => {
    const activeStudents = classStudents.filter(
      (student) => student.status !== 'WaitingList' && student.status !== 'Replaced'
    );
    const waitingList = classStudents.filter((student) => student.status === 'WaitingList').length;
    const replaced = classStudents.filter((student) => student.status === 'Replaced').length;

    const totalRevenue = activeStudents.reduce(
      (sum, student) => sum + (student.totalValue || 0),
      0
    );

    const paidStudents = activeStudents.filter(
      (student) => student.payments && !student.payments.pending
    ).length;

    const receivedRevenue = activeStudents
      .filter((student) => student.payments && !student.payments.pending)
      .reduce((sum, student) => sum + (student.totalValue || 0), 0);

    return {
      total: activeStudents.length,
      waitingList,
      replaced,
      totalRevenue,
      receivedRevenue,
      pendingRevenue: Math.max(totalRevenue - receivedRevenue, 0),
      paidStudents,
    };
  }, [classStudents]);

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const generateStudentCode = (counter: number) => {
    return `A${counter.toString().padStart(4, '0')}`;
  };

  const handleAddStudent = (data: {
    name: string;
    taxId: string;
    rg: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    selectedProductId?: string;
  }) => {
    if (!classItem) return;

    const taxId = cleanTaxId(data.taxId);
    const duplicate = classStudents.find(
      (student) => cleanTaxId(student.taxId || '') === taxId && !student.isReplaced
    );

    if (duplicate) {
      toast.error('Ja existe um aluno com este CPF nesta turma.');
      return;
    }

    const now = new Date().toISOString();
    const coursePrice = course?.price ?? classItem.price ?? 0;
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      code: generateStudentCode(students.length + 1),
      name: data.name,
      taxId,
      rg: data.rg || undefined,
      birthDate: data.birthDate || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      status: 'Active',
      linkStatus: 'Scheduled',
      classId: classItem.id,
      totalValue: coursePrice,
      studentStartDate: classItem.startDate,
      studentEndDate: classItem.endDate,
      createdAt: now,
      updatedAt: now,
    };

    addStudent(newStudent);
  };

  const handleAddWaitingList = (data: {
    name: string;
    taxId: string;
    rg: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
  }) => {
    if (!classItem) return;

    const now = new Date().toISOString();
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      code: generateStudentCode(students.length + 1),
      name: data.name,
      taxId: cleanTaxId(data.taxId),
      rg: data.rg || undefined,
      birthDate: data.birthDate || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      status: 'WaitingList',
      linkStatus: 'Scheduled',
      classId: classItem.id,
      isWaitingList: true,
      totalValue: 0,
      studentStartDate: classItem.startDate,
      studentEndDate: classItem.endDate,
      createdAt: now,
      updatedAt: now,
    };

    addStudent(newStudent);
  };

  const handleBulkAdd = (rows: { name: string; taxId: string; rg?: string; dataNascimento?: string; email?: string; telefone?: string; endereco?: string; observacoes?: string; }[]) => {
    if (!classItem) return;

    const now = new Date().toISOString();
    const coursePrice = course?.price ?? classItem.price ?? 0;
    let created = 0;
    let skipped = 0;
    let counter = students.length;
    const seenTaxIds = new Set(classStudents.map((student) => cleanTaxId(student.taxId || '')));

    rows.forEach((row) => {
      const taxId = cleanTaxId(row.taxId || '');
      if (!row.name || !taxId) {
        skipped += 1;
        return;
      }

      if (seenTaxIds.has(taxId)) {
        skipped += 1;
        return;
      }

      counter += 1;
      seenTaxIds.add(taxId);

      const newStudent: Student = {
        id: `student-${Date.now()}-${created}`,
        code: generateStudentCode(counter),
        name: row.name,
        taxId,
        rg: row.rg || undefined,
        birthDate: row.dataNascimento || undefined,
        phone: row.telefone || undefined,
        email: row.email || undefined,
        address: row.endereco || undefined,
        status: 'Active',
        linkStatus: 'Scheduled',
        classId: classItem.id,
        totalValue: coursePrice,
        studentStartDate: classItem.startDate,
        studentEndDate: classItem.endDate,
        notes: row.observacoes || undefined,
        createdAt: now,
        updatedAt: now,
      };

      addStudent(newStudent);
      created += 1;
    });

    if (created > 0) {
      toast.success(`${created} aluno(s) cadastrado(s) na turma.`);
    }

    if (skipped > 0) {
      toast.info(`${skipped} registro(s) ignorado(s) por duplicidade ou dados incompletos.`);
    }
  };

  if (!classItem) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Turma nao encontrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A turma solicitada nao existe ou foi removida.
            </p>
            <Button asChild variant="outline">
              <Link href="/classes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para turmas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/classes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Turmas
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {classItem.displayName || course?.name || classItem.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {classItem.code} • {CLASS_STATUS_LABELS[classItem.status]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importar planilha
          </Button>
          <Button variant="outline" onClick={() => setWaitingListOpen(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Fila de espera
          </Button>
          <Button variant="outline" onClick={() => setAddStudentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo aluno
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar turma
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informacoes da turma</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                {classItem.schedule || 'Horario nao definido'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                {room?.name || 'Sala nao definida'}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {stats.total}/{classItem.maxStudents} alunos ativos
              </div>
            </div>
            {company && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Turma PJ</Badge>
                <span className="text-sm">{company.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metricas financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Previsao total</p>
              <p className="text-lg font-semibold text-blue-700">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(stats.receivedRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatCurrency(stats.pendingRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alunos da turma</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">Ativos: {stats.total}</Badge>
            <Badge variant="outline">Fila: {stats.waitingList}</Badge>
            <Badge variant="outline">Substituidos: {stats.replaced}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {classStudents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum aluno matriculado nesta turma.
            </div>
          ) : (
            classStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                classData={classItem}
                course={course}
                onUpdateStudent={updateStudent}
                onDeleteStudent={deleteStudent}
                instructors={instructors}
                extraProducts={extraProducts}
                users={users}
                students={students}
                companies={companies}
                currentUser={currentUser || undefined}
                emailConfig={{ enabled: Boolean(emailConfig) }}
                whatsappConfig={whatsappConfig || undefined}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        onAdd={handleAddStudent}
        className={classItem.displayName || classItem.name}
        coursePrice={course?.price ?? classItem.price ?? 0}
        availableProducts={extraProducts
          .filter((product) => product.active)
          .map((product) => ({
            id: product.id,
            code: product.type === 'product' ? 'PV' : 'EX',
            name: product.name,
            price: product.price,
            type: product.type,
          }))}
      />

      <UploadSpreadsheetDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        turmaId={classItem.id}
        turmaNome={classItem.displayName || classItem.name}
        valorTurma={course?.price ?? classItem.price ?? 0}
        onCadastrar={handleBulkAdd}
      />

      <AddWaitingListDialog
        open={waitingListOpen}
        onOpenChange={setWaitingListOpen}
        className={classItem.displayName || classItem.name}
        onAdd={handleAddWaitingList}
      />

      <ClassFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        classToEdit={classItem}
      />
    </div>
  );
}
