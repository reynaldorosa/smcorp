'use client';

import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Instructor } from '@/types';

interface AddInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructors: Instructor[];
  alreadyLinkedInstructorIds: string[];
  onConfirm: (instructorId: string) => void;
}

export const AddInstructorDialog: React.FC<AddInstructorDialogProps> = ({
  open,
  onOpenChange,
  instructors,
  alreadyLinkedInstructorIds,
  onConfirm
}) => {
  const [search, setSearch] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  const filteredInstructors = instructors.filter((instructor) => {
    const searchLower = search.toLowerCase();
    return (
      instructor.name.toLowerCase().includes(searchLower) ||
      (instructor.code || '').toLowerCase().includes(searchLower) ||
      (instructor.specializations?.join(' ') || '').toLowerCase().includes(searchLower)
    );
  });

  const handleConfirm = () => {
    if (selectedInstructorId) {
      onConfirm(selectedInstructorId);
      setSelectedInstructorId(null);
      setSearch('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Adicionar Instrutor à Turma
          </DialogTitle>
          <DialogDescription>
            Selecione um instrutor da lista para vincular a esta turma
          </DialogDescription>
        </DialogHeader>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, código ou função..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Instructor List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredInstructors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {instructors.length === 0 
                ? 'Nenhum instrutor cadastrado no sistema'
                : 'Nenhum instrutor encontrado com os critérios de busca'}
            </div>
          ) : (
            filteredInstructors.map((instructor) => {
              const alreadyLinked = alreadyLinkedInstructorIds.includes(instructor.id);
              const isSelected = selectedInstructorId === instructor.id;

              return (
                <Card 
                  key={instructor.id}
                  className={`cursor-pointer transition-all ${
                    alreadyLinked 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                      : isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                  onClick={() => !alreadyLinked && setSelectedInstructorId(instructor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {instructor.code || `INS-${instructor.id.slice(0, 4).toUpperCase()}`}
                          </Badge>
                          <h3 className="font-semibold text-gray-900">
                            {instructor.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {instructor.specializations?.[0] || 'Instrutor'}
                        </p>
                      </div>
                      {alreadyLinked && (
                        <Badge className="bg-gray-500">
                          Já vinculado
                        </Badge>
                      )}
                      {isSelected && !alreadyLinked && (
                        <Badge className="bg-purple-600">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedInstructorId(null);
              setSearch('');
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedInstructorId}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
