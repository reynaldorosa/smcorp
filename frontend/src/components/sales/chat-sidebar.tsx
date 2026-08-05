'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { Contact, ReadyMessage } from './types';
import type { Course } from '@/stores/courses.store';
import type { Class } from '@/stores/classes.store';
import { formatCurrency, getStatusColor, getStatusLabel } from './helpers';

interface ChatSidebarProps {
  selectedContact: Contact;
  contacts: Contact[];
  courses: Course[];
  classes: Class[];
  readyMessages: ReadyMessage[];
  onSetMessage: (text: string) => void;
}

export function ChatSidebar({
  selectedContact,
  contacts,
  courses,
  classes,
  readyMessages,
  onSetMessage,
}: ChatSidebarProps) {
  return (
    <div className="w-[320px] border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4">
        {/* Contact Profile */}
        <div className="text-center mb-4 pb-4 border-b border-gray-100">
          {selectedContact.photo ? (
            <img
              src={selectedContact.photo}
              alt={selectedContact.name}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-2xl">
                {selectedContact.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
          <p className="text-sm text-gray-500">{selectedContact.phone}</p>
          <Badge className={`mt-2 ${getStatusColor(selectedContact.status)}`}>
            {getStatusLabel(selectedContact.status)}
          </Badge>
        </div>

        <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>

        <div className="space-y-3">
          {/* Course Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Informações dos Cursos</h4>
            <div className="space-y-2">
              {courses.slice(0, 3).map((course) => (
                <Button
                  key={course.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    onSetMessage(`${course.name} - ${formatCurrency(course.price)}`);
                  }}
                >
                  {course.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Ready Messages - matching Figma */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-green-900 mb-2">Mensagens Prontas</h4>
            <div className="space-y-1">
              {readyMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => onSetMessage(msg.text)}
                  className="w-full text-left text-xs text-green-700 hover:text-green-900 hover:bg-green-100 rounded px-2 py-1 transition-colors"
                >
                  • {msg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Classes */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Próximas Turmas</h4>
            <div className="space-y-2">
              {classes.slice(0, 3).map((classItem) => {
                const course = courses.find((c) => c.id === classItem.courseId);
                return (
                  <div
                    key={classItem.id}
                    className="p-2 bg-white rounded text-xs border border-purple-100"
                  >
                    <p className="font-medium text-purple-900">{classItem.code}</p>
                    <p className="text-purple-600">
                      {course?.name} • {classItem.availableSpots} vagas
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics - matching Figma */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Estatísticas</h4>
            <div className="space-y-1 text-xs text-yellow-700">
              <p>• Leads ativos: {contacts.filter((c) => c.status === 'lead').length}</p>
              <p>
                • Taxa de conversão:{' '}
                {contacts.length > 0
                  ? Math.round(
                      (contacts.filter((c) => c.status === 'enrolled').length / contacts.length) *
                        100
                    )
                  : 0}
                %
              </p>
              <p>• Tempo médio de resposta: 15min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
