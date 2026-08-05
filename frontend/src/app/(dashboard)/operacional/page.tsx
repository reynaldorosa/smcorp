'use client';

// ============================================
// MÓDULO 03 - DASHBOARD OPERACIONAL
// Gestão de Alunos e Turmas
// 
// Padrão: Slim page.tsx com componentes em /components/operational/
// ============================================

import { useState } from 'react';
import { OperationalDashboard } from '@/components/operational';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutDashboard, Search, Users, Plus } from 'lucide-react';

export default function OperacionalPage() {
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Area */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
             <div className="max-w-7xl mx-auto">
               <div className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-600 rounded-none shadow-md">
                         <LayoutDashboard className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Operacional</h1>
                         <p className="text-slate-600 text-sm">
                            Gestão de turmas e alunos em tempo real
                         </p>
                       </div>
                   </div>
                   
                   {/* Controles */}
                   <div className="flex items-center gap-3">
                       {/* Busca de Turmas */}
                       <div className="relative w-56">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <Input
                           placeholder="Buscar turmas..."
                           value={courseSearch}
                           onChange={(e) => setCourseSearch(e.target.value)}
                           className="pl-9 h-10"
                         />
                       </div>

                       {/* Busca de Alunos */}
                       <div className="relative w-56">
                         <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <Input
                           placeholder="Buscar alunos..."
                           value={studentSearch}
                           onChange={(e) => setStudentSearch(e.target.value)}
                           className="pl-9 h-10"
                         />
                       </div>
                   </div>
               </div>
             </div>
          </div>

          {/* Main Content Area - Full Width Card */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="p-6 h-full">
                      <OperationalDashboard 
                        courseSearchProp={courseSearch}
                        studentSearchProp={studentSearch}
                      />
                    </div>
                 </div>
              </Card>
            </div>
          </main>
      </div>
    </div>
  );
}
