'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileCheck, Filter, Search, User, Image as ImageIcon, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useClassesStore } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { StudentDocumentsDetail } from '@/components/documents';

import { studentsService } from '@/services/students.service';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { roomsService } from '@/services/rooms.service';
import { toast } from 'sonner';

// ============================================
type StatusFilter = 'todos' | 'pendente-foto' | 'pendente-docs' | 'completo';

function hasAllDocumentsApproved(student: Student): boolean {
  return !!student.documentsComplete;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DocumentsPage() {
  // Stores
  const { students, setStudents, updateStudent } = useStudentsStore();
  const { classes, setClasses } = useClassesStore();
  const { courses, setCourses } = useCoursesStore();
  const { rooms, setRooms } = useSettingsStore();

  // State
  const [classFilter, setClassFilterState] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const apiFallbackNotifiedRef = useRef(false);

  const setClassFilter = (value: string) => {
    setClassFilterState(value);
  };

  const notifyApiFallback = () => {
    if (apiFallbackNotifiedRef.current) return;
    apiFallbackNotifiedRef.current = true;
    toast.warning('API de documentos indisponível. Exibindo dados locais.');
  };

  // Garantir base conectada (mesmo padrão usado em CRM/Certificados/Vendas)
  useEffect(() => {
    if (students.length > 0) return;
    const loadStudents = async () => {
      try {
        const data = await studentsService.getAll();
        if (data.length > 0) setStudents(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadStudents();
  }, [students.length, setStudents]);

  useEffect(() => {
    if (classes.length > 0) return;
    const loadClasses = async () => {
      try {
        const data = await classesService.getAll();
        if (data.length > 0) setClasses(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadClasses();
  }, [classes.length, setClasses]);

  useEffect(() => {
    if (courses.length > 0) return;
    const loadCourses = async () => {
      try {
        const data = await coursesService.getAll();
        if (data.length > 0) setCourses(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadCourses();
  }, [courses.length, setCourses]);

  useEffect(() => {
    if (rooms.length > 0) return;
    const loadRooms = async () => {
      try {
        const data = await roomsService.getActive();
        if (data.length > 0) {
          setRooms(
            data.map((room) => ({
              id: room.id,
              name: room.name,
              location: room.location,
              address: room.address,
              capacity: room.capacity,
              dailyCost: room.dailyCost,
              active: room.active,
            }))
          );
        }
      } catch {
        notifyApiFallback();
      }
    };
    loadRooms();
  }, [rooms.length, setRooms]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filtro por turma
    if (classFilter !== 'todas') {
      filtered = filtered.filter((student) => student.classId === classFilter);
    }

    // Filtro por status
    if (statusFilter === 'pendente-foto') {
      filtered = filtered.filter((student) => !student.photoUrl);
    } else if (statusFilter === 'pendente-docs') {
      filtered = filtered.filter((student) => !hasAllDocumentsApproved(student));
    } else if (statusFilter === 'completo') {
      filtered = filtered.filter(
        (student) => !!student.photoUrl && hasAllDocumentsApproved(student)
      );
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((student) => {
        const name = student.name.toLowerCase();
        const code = student.code.toLowerCase();
        const taxId = (student.taxId || '').toLowerCase();
        return name.includes(term) || code.includes(term) || taxId.includes(term);
      });
    }

    return filtered;
  }, [students, classFilter, statusFilter, searchQuery]);

  const getClassInfo = (classId?: string) => {
    if (!classId) return null;
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) return null;
    const course = courses.find((c) => c.id === classItem.courseId);
    const room = rooms.find((r) => r.id === classItem.roomId);
    return { classItem, course, room };
  };

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const withPhoto = filteredStudents.filter((s) => !!s.photoUrl).length;
    const withDocs = filteredStudents.filter((s) => hasAllDocumentsApproved(s)).length;
    const complete = filteredStudents.filter(
      (s) => !!s.photoUrl && hasAllDocumentsApproved(s)
    ).length;
    return { total, withPhoto, withDocs, complete };
  }, [filteredStudents]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const handleVisualizarAluno = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-red-600" />
            Módulo 06 - Validação de Documentos
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie documentos e fotos dos alunos, faça upload em nome deles e valide informações
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Alunos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Com Foto</p>
                  <p className="text-2xl font-bold text-green-600">{stats.withPhoto}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Com Documentos</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.withDocs}</p>
                </div>
                <FileCheck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.complete}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Turma</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">📚 Todas as Turmas</SelectItem>
                    {classes.map((classItem) => {
                      const course = courses.find((c) => c.id === classItem.courseId);
                      return (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.code} - {classItem.displayName || classItem.name || course?.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="pendente-foto">⚠️ Pendente Foto</SelectItem>
                    <SelectItem value="pendente-docs">⚠️ Pendente Documentos</SelectItem>
                    <SelectItem value="completo">✅ Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nome, código ou CPF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <CardTitle>Alunos ({filteredStudents.length})</CardTitle>
            <CardDescription>
              Clique em um aluno para visualizar e gerenciar seus documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum aluno encontrado com os filtros selecionados</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const classInfo = getClassInfo(student.classId);
                  const docsOk = hasAllDocumentsApproved(student);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Foto */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* Informações */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{student.name}</p>
                            <Badge variant="outline">{student.code}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {classInfo?.classItem.code || 'Sem turma'} -{' '}
                            {classInfo?.classItem.displayName || classInfo?.course?.name || classInfo?.classItem.name || '—'}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex gap-2">
                          <Badge
                            variant={student.photoUrl ? 'default' : 'destructive'}
                            className={student.photoUrl ? 'bg-green-600' : undefined}
                          >
                            {student.photoUrl ? '✓ Foto' : '✗ Foto'}
                          </Badge>
                          <Badge
                            variant={docsOk ? 'default' : 'destructive'}
                            className={docsOk ? 'bg-green-600' : undefined}
                          >
                            {docsOk ? '✓ Docs' : '✗ Docs'}
                          </Badge>
                        </div>
                      </div>

                      {/* Botão Visualizar */}
                      <Button
                        onClick={() => handleVisualizarAluno(student.id)}
                        variant="outline"
                        className="ml-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Visualização do Aluno - Abre direto no modo detalhado */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Validação de Documentos</DialogTitle>
              <DialogDescription>Detalhes do aluno selecionado</DialogDescription>
            </DialogHeader>

            {(() => {
              if (!selectedStudent) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    Selecione um aluno para visualizar os detalhes
                  </div>
                );
              }

              const classInfo = getClassInfo(selectedStudent.classId);
              const course = classInfo?.course;
              const classData = classInfo?.classItem;
              const roomName = classInfo?.room?.name;

              if (!course || !classData) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    Informações de turma ou curso não disponíveis
                  </div>
                );
              }

              return (
                <StudentDocumentsDetail
                  student={selectedStudent}
                  course={course}
                  classData={classData}
                  roomName={roomName}
                  requiredDocuments={course.requiredDocuments}
                  onUpdateStudent={(studentId, data) => {
                    updateStudent(studentId, data);
                  }}
                  onClose={() => setIsDetailDialogOpen(false)}
                />
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
