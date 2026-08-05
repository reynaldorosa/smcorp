'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, BookOpen, Filter, Loader2, RefreshCw, CheckCircle2, Archive, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCoursesStore, type Course } from '@/stores/courses.store';
import { coursesService } from '@/services/courses.service';
import { extraProductsService } from '@/services/extra-products.service';
import { toast } from 'sonner';
import { CourseCard } from './course-card';
import { CourseFormDialog } from './course-form-dialog';
import { CourseDeleteDialog } from './course-delete-dialog';

// ============================================
// TYPES
// ============================================

interface ProductInfo {
  id: string;
  code: string;
  name: string;
  price: number;
  type: string;
}

// ============================================
// COMPONENT
// ============================================

export function CourseList() {
  const { courses, setCourses } = useCoursesStore();

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductInfo[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ProductInfo[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Load courses from API
  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await coursesService.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast.error('Erro ao carregar cursos do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsAndExtras = async () => {
    try {
      const records = await extraProductsService.getActive();
      const mapped = records.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        price: item.price,
        type: item.type,
      }));

      setAvailableProducts(mapped.filter((item) => item.type === 'product'));
      setAvailableExtras(mapped.filter((item) => item.type === 'extra'));
    } catch (error) {
      console.error('Erro ao carregar produtos e extras:', error);
      toast.error('Erro ao carregar produtos/extras do Módulo 00');
      setAvailableProducts([]);
      setAvailableExtras([]);
    }
  };

  useEffect(() => {
    loadCourses();
    loadProductsAndExtras();
  }, []);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (statusFilter === 'ativos' && !course.active) return false;
      if (statusFilter === 'inativos' && course.active) return false;
      return true;
    });
  }, [courses, statusFilter]);

  // Handlers
  const handleAddNew = () => {
    setEditingCourse(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'ativos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ativos')}
              className={statusFilter === 'ativos' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ativos
            </Button>
            <Button
              variant={statusFilter === 'inativos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inativos')}
              className={statusFilter === 'inativos' ? 'bg-slate-600 hover:bg-slate-700' : ''}
            >
              <Archive className="mr-2 h-4 w-4" />
              Inativos
            </Button>
            <Button
              variant={statusFilter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('todos')}
              className={statusFilter === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <List className="mr-2 h-4 w-4" />
              Todos
            </Button>
          </div>
          <Badge variant="secondary">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadCourses} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button size="lg" className="bg-red-600 hover:bg-red-700" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Curso
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Carregando cursos...</h3>
            <p className="text-muted-foreground">Buscando dados do servidor</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredCourses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro curso para começar
            </p>
            <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Curso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
              availableProducts={availableProducts}
              availableExtras={availableExtras}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CourseFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        course={editingCourse}
        availableProducts={availableProducts}
        availableExtras={availableExtras}
      />

      {/* Delete Dialog */}
      <CourseDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        course={courseToDelete}
      />
    </>
  );
}
