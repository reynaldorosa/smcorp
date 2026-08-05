'use client';

import React, { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassList } from '@/components/classes';
import { CalendarDays } from 'lucide-react';

// ============================================
// Loading Fallback
// ============================================

function LoadingFallback() {
  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden p-6">
      <div className="space-y-4 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Main Page
// ============================================

export default function ClassesPage() {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Area */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
             <div className="max-w-7xl mx-auto">
               <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-600 rounded-none shadow-md">
                     <CalendarDays className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Turmas e Agendamentos</h1>
                     <p className="text-slate-600 text-sm">
                        Planejamento e execução de turmas - Cronograma, alocação e faturamento
                     </p>
                   </div>
               </div>
             </div>
          </div>

          {/* Main Content Area - Full Width Card */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="p-6">
                      <Suspense fallback={<LoadingFallback />}>
                        <ClassList />
                      </Suspense>
                    </div>
                 </div>
              </Card>
            </div>
          </main>
      </div>
    </div>
  );
}
