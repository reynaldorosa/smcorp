'use client';

import React from 'react';
import {
  Clock,
  FileText,
  CheckSquare,
  Edit,
  Trash2,
  Upload,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/stores/courses.store';

// ============================================
// TYPES
// ============================================

export interface DocumentoObrigatorio {
  name: string;
  requiresUpload: boolean;
}

interface ProductInfo {
  id: string;
  code: string;
  name: string;
  price: number;
  type: string;
}

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  availableProducts: ProductInfo[];
  availableExtras: ProductInfo[];
}

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function calculateRequiredDays(totalHours: number, hoursPerDay: number): number {
  return Math.ceil(totalHours / hoursPerDay);
}

// ============================================
// COMPONENT
// ============================================

export function CourseCard({ course, onEdit, onDelete, availableProducts, availableExtras }: CourseCardProps) {
  const requiredDays = calculateRequiredDays(course.duration, course.hoursPerDay || 8);
  const docs = (course.requiredDocuments as DocumentoObrigatorio[]) || [];

  // Get financial info
  const products = availableProducts.filter(p => (course.linkedProducts as string[] || []).includes(p.id));
  const extras = availableExtras.filter(e => (course.linkedExtras as string[] || []).includes(e.id));
  const totalFinancial = products.reduce((acc, p) => acc + p.price, 0) + extras.reduce((acc, e) => acc + e.price, 0);

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default" className="bg-red-600 text-white font-mono">
                {course.code}
              </Badge>
              <CardTitle className="text-xl text-red-600">{course.name}</CardTitle>
              {!course.active && (
                <Badge variant="secondary" className="bg-gray-200">Inativo</Badge>
              )}
            </div>
            <CardDescription className="mt-2">{course.description || 'Sem descrição'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              {course.duration}h totais
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(course)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(course)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Configuração de Tempo */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Configuração de Tempo
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Horas/Dia:</span>
                <span className="font-medium">{course.hoursPerDay || 8}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horário:</span>
                <span className="font-medium">{course.startTime || '08:00'} - {course.endTime || '17:00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Intervalo:</span>
                <span className="font-medium">{course.breakDuration || 60} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dias necessários:</span>
                <span className="font-medium">{requiredDays} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fim de semana:</span>
                <span className="font-medium">{course.useWeekends ? 'Sim' : 'Não'}</span>
              </div>
              {course.certificationValidity && course.certificationValidity > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Validade:</span>
                  <span className="font-medium">{course.certificationValidity} meses</span>
                </div>
              )}
            </div>
          </div>

          {/* Documentos Obrigatórios */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Documentos Obrigatórios
            </h4>
            <div className="flex flex-wrap gap-2">
              {docs.length > 0 ? (
                docs.map((doc, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {doc.requiresUpload ? <Upload className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                    {doc.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">Nenhum documento definido</span>
              )}
            </div>
          </div>

          {/* Vínculo Financeiro */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-600" />
              Vínculo Financeiro
            </h4>
            <div className="space-y-2 text-sm">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between">
                  <span className="text-gray-600">{product.name}:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(product.price)}</span>
                </div>
              ))}
              {extras.map((extra) => (
                <div key={extra.id} className="flex justify-between">
                  <span className="text-gray-600">{extra.name}:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(extra.price)}</span>
                </div>
              ))}
              {totalFinancial > 0 ? (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalFinancial)}</span>
                </div>
              ) : (
                <span className="text-gray-500">Nenhum produto vinculado</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
