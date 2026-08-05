'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Database,
  FileJson,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
  Package,
  Building2,
  FileText,
  Settings,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { IrataDataMigration } from './irata-data-migration';
import { ClearData } from './clear-data';
import { DownloadCompleteProject } from './download-complete-project';
import { coursesService } from '@/services/courses.service';
import { classesService } from '@/services/classes.service';
import { studentsService } from '@/services/students.service';
import { companiesService } from '@/services/companies.service';
import { extraProductsService } from '@/services/extra-products.service';
import { roomsService } from '@/services/rooms.service';
import { instructorsService } from '@/services/instructors.service';
import { suppliersService } from '@/services/suppliers.service';
import { usersService } from '@/services/users.service';
import { documentOperations } from '@/services/operations.service';

// ============================================
// TYPES
// ============================================

interface BackupModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  recordCount: number;
  selected: boolean;
}

interface BackupHistory {
  id: string;
  date: string;
  time: string;
  modules: string[];
  size: string;
  status: 'completed' | 'failed';
}

// ============================================
// MODULE DEFINITIONS (NO MOCK DATA)
// ============================================

const BACKUP_MODULES: BackupModule[] = [
  { id: 'courses', name: 'Cursos (Módulo 01)', description: 'DNA técnico dos cursos', icon: GraduationCap, recordCount: 0, selected: true },
  { id: 'classes', name: 'Turmas (Módulo 02)', description: 'Turmas e matrículas', icon: Users, recordCount: 0, selected: true },
  { id: 'students', name: 'Alunos (Módulo 03)', description: 'Cadastro de alunos', icon: Users, recordCount: 0, selected: true },
  { id: 'documents', name: 'Documentos (Módulo 04)', description: 'Documentos e certidões', icon: FileText, recordCount: 0, selected: false },
  { id: 'companies', name: 'Empresas (Módulo 00)', description: 'Clientes PJ', icon: Building2, recordCount: 0, selected: true },
  { id: 'products', name: 'Produtos (Módulo 00)', description: 'Catálogo de produtos', icon: Package, recordCount: 0, selected: true },
  { id: 'settings', name: 'Configurações', description: 'Salas, instrutores, fornecedores', icon: Settings, recordCount: 0, selected: false },
];

type ExportModuleId = BackupModule['id'];

type ExportData = {
  exportDate: string;
  modules: Array<{ id: ExportModuleId; name: string; recordCount: number }>;
  totalRecords: number;
  data: Record<string, unknown>;
};

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!successful) {
    throw new Error('Clipboard indisponível');
  }
}

async function fetchAllPages<T>(fetchPage: (page: number, limit: number) => Promise<unknown>, limit = 200): Promise<T[]> {
  const first = await fetchPage(1, limit);
  const firstPage = first as { data?: unknown[]; meta?: { totalPages?: number }; totalPages?: number };
  const firstData: T[] = Array.isArray(firstPage?.data) ? (firstPage.data as T[]) : [];
  const totalPages: number =
    Number(firstPage?.meta?.totalPages) ||
    Number(firstPage?.totalPages) ||
    1;

  if (totalPages <= 1) return firstData;

  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, idx) => fetchPage(idx + 2, limit)),
  );
  const rest = pages.flatMap((page) => {
    const current = page as { data?: unknown[] };
    return Array.isArray(current?.data) ? (current.data as T[]) : [];
  });
  return [...firstData, ...rest];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BackupTab() {
  const [modules, setModules] = useState<BackupModule[]>(BACKUP_MODULES);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [copiedModule, setCopiedModule] = useState<string | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [lastExportData, setLastExportData] = useState<ExportData | null>(null);

  const selectedModules = useMemo(() => modules.filter((m) => m.selected), [modules]);
  const totalRecords = useMemo(
    () => selectedModules.reduce((sum, m) => sum + (m.recordCount || 0), 0),
    [selectedModules],
  );

  const updateModuleCounts = (counts: Partial<Record<ExportModuleId, number>>) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        recordCount: typeof counts[m.id] === 'number' ? (counts[m.id] as number) : m.recordCount,
      })),
    );
  };

  const buildExportData = async (moduleIds: ExportModuleId[]): Promise<ExportData> => {
    const exportDate = new Date().toISOString();
    const data: Record<string, unknown> = {};
    const counts: Partial<Record<ExportModuleId, number>> = {};

    const totalSteps = Math.max(moduleIds.length, 1);
    let completedSteps = 0;
    const bumpProgress = () => {
      completedSteps += 1;
      setExportProgress(Math.min(100, (completedSteps / totalSteps) * 100));
    };

    for (const id of moduleIds) {
      if (id === 'courses') {
        const records = await coursesService.getAll();
        data.courses = records;
        counts.courses = Array.isArray(records) ? records.length : 0;
        bumpProgress();
        continue;
      }
      if (id === 'classes') {
        const records = await classesService.getAll();
        data.classes = records;
        counts.classes = Array.isArray(records) ? records.length : 0;
        bumpProgress();
        continue;
      }
      if (id === 'students') {
        const records = await studentsService.getAll();
        data.students = records;
        counts.students = Array.isArray(records) ? records.length : 0;
        bumpProgress();
        continue;
      }
      if (id === 'companies') {
        const records = await fetchAllPages((page, limit) => companiesService.getAll(page, limit), 200);
        data.companies = records;
        counts.companies = records.length;
        bumpProgress();
        continue;
      }
      if (id === 'products') {
        const records = await fetchAllPages((page, limit) => extraProductsService.getAll(page, limit), 200);
        data.products = records;
        counts.products = records.length;
        bumpProgress();
        continue;
      }
      if (id === 'settings') {
        const [rooms, instructors, suppliers, users] = await Promise.all([
          fetchAllPages((page, limit) => roomsService.getAll(page, limit), 200),
          instructorsService.getAll(),
          fetchAllPages((page, limit) => suppliersService.getAll(page, limit), 200),
          fetchAllPages((page, limit) => usersService.getAll(page, limit), 200),
        ]);
        const settings = { rooms, instructors, suppliers, users };
        data.settings = settings;
        counts.settings = rooms.length + instructors.length + suppliers.length + users.length;
        bumpProgress();
        continue;
      }
      if (id === 'documents') {
        const students = await studentsService.getAll();
        const byStudent: Record<string, unknown> = {};
        let total = 0;
        for (const student of students) {
          const docs = await documentOperations.getByStudent(student.id);
          byStudent[student.id] = docs;
          total += Array.isArray(docs) ? docs.length : 0;
        }
        data.documents = { byStudent, totalDocuments: total };
        counts.documents = total;
        bumpProgress();
        continue;
      }
    }

    updateModuleCounts(counts);
    const modulesPayload = moduleIds
      .map((id) => {
        const moduleConfig = modules.find((m) => m.id === id);
        return moduleConfig
          ? { id, name: moduleConfig.name, recordCount: counts[id] ?? moduleConfig.recordCount ?? 0 }
          : null;
      })
      .filter(Boolean) as ExportData['modules'];

    const total = modulesPayload.reduce((sum, m) => sum + m.recordCount, 0);
    return {
      exportDate,
      modules: modulesPayload,
      totalRecords: total,
      data,
    };
  };

  // Copy module data to clipboard
  const copyToClipboard = async (moduleId: ExportModuleId, moduleName: string) => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      const exportData = await buildExportData([moduleId]);
      await copyTextToClipboard(JSON.stringify(exportData, null, 2));
      setCopiedModule(moduleId);
      toast.success(`${moduleName} copiado para a área de transferência!`);
      setTimeout(() => setCopiedModule(null), 2000);
    } catch {
      toast.error('Não foi possível copiar (API indisponível).');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Copy all data to clipboard
  const copyAllToClipboard = async () => {
    if (selectedModules.length === 0) return;
    try {
      setIsExporting(true);
      setExportProgress(0);
      const exportData = await buildExportData(selectedModules.map((m) => m.id));
      await copyTextToClipboard(JSON.stringify(exportData, null, 2));
      toast.success('Backup completo copiado para a área de transferência!');
    } catch {
      toast.error('Não foi possível copiar (API indisponível).');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, selected: !m.selected } : m
    ));
  };

  // Select/deselect all
  const toggleAll = (selected: boolean) => {
    setModules(prev => prev.map(m => ({ ...m, selected })));
  };

  // Start export
  const handleExport = async () => {
    if (selectedModules.length === 0) {
      toast.error('Selecione pelo menos um módulo para exportar');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportData = await buildExportData(selectedModules.map((m) => m.id));
      setLastExportData(exportData);
      setLastBackup(new Date().toLocaleString('pt-BR'));

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      const sizeKb = Math.max(1, Math.round(blob.size / 1024));
      const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      setBackupHistory((prev) => [
        {
          id: `${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          modules: exportData.modules.map((m) => m.name),
          size: sizeLabel,
          status: 'completed',
        },
        ...prev,
      ]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-portalsmcorp-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      toast.success('Backup exportado com sucesso!');
    } catch {
      setBackupHistory((prev) => [
        {
          id: `${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          modules: selectedModules.map((m) => m.name),
          size: '—',
          status: 'failed',
        },
        ...prev,
      ]);
      toast.error('Não foi possível exportar backup (API indisponível).');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  useEffect(() => {
    // Pre-carregar contagens leves para UI (sem documentos)
    const loadCounts = async () => {
      try {
        const [courses, classes, students, companies, products, rooms, suppliers, users, instructors] = await Promise.all([
          coursesService.getAll(),
          classesService.getAll(),
          studentsService.getAll(),
          fetchAllPages((page, limit) => companiesService.getAll(page, limit), 200),
          fetchAllPages((page, limit) => extraProductsService.getAll(page, limit), 200),
          fetchAllPages((page, limit) => roomsService.getAll(page, limit), 200),
          fetchAllPages((page, limit) => suppliersService.getAll(page, limit), 200),
          fetchAllPages((page, limit) => usersService.getAll(page, limit), 200),
          instructorsService.getAll(),
        ]);

        updateModuleCounts({
          courses: Array.isArray(courses) ? courses.length : 0,
          classes: Array.isArray(classes) ? classes.length : 0,
          students: Array.isArray(students) ? students.length : 0,
          companies: companies.length,
          products: products.length,
          settings: rooms.length + suppliers.length + users.length + instructors.length,
        });
      } catch (error) {
        console.error('Falha ao carregar contagens do backup:', error);
        toast.warning('Não foi possível carregar contagens do backup. Exibindo valores padrão.');
      }
    };

    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Export Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-600" />
                Exportar Dados do Sistema
              </CardTitle>
              <CardDescription>
                Faça backup dos dados do Portal para arquivo JSON
              </CardDescription>
            </div>
            {lastBackup && (
              <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Último backup: {lastBackup}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Module Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Selecione os módulos para exportar:</Label>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleAll(true)}
                  className="text-xs"
                >
                  Selecionar todos
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleAll(false)}
                  className="text-xs"
                >
                  Limpar seleção
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      module.selected
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <Checkbox
                      checked={module.selected}
                      onCheckedChange={() => toggleModule(module.id)}
                      onClick={(event) => event.stopPropagation()}
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Icon className={`w-5 h-5 ${module.selected ? 'text-red-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${module.selected ? 'text-red-900' : 'text-gray-700'}`}>
                        {module.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{module.description}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {module.recordCount} registros
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {selectedModules.length} módulo(s) selecionado(s)
                </p>
                <p className="text-xs text-blue-700">
                  Total de {totalRecords} registros para exportar
                </p>
              </div>
              <FileJson className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Exportando dados...</span>
                <span className="font-medium">{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedModules.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar Backup (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Histórico de Backups
          </CardTitle>
          <CardDescription>
            Últimas exportações realizadas nesta sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum backup realizado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    backup.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {backup.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium">{backup.date}</span>
                        <span className="text-xs text-gray-500">{backup.time}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {backup.modules.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        backup.status === 'completed'
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-red-100 border-red-300 text-red-700'
                      }
                    >
                      {backup.status === 'completed' ? 'Sucesso' : 'Falhou'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{backup.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clipboard Copy Section */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-green-600" />
            Copiar para Área de Transferência
          </CardTitle>
          <CardDescription>
            Copie os dados diretamente para colar em um arquivo de texto ou JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={copyAllToClipboard}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={selectedModules.length === 0}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Backup Completo
          </Button>
          <p className="text-xs text-gray-500">
            Total: {selectedModules.length} módulos selecionados com {totalRecords} registros
          </p>

          {/* Individual module copy buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedModules.slice(0, 6).map((module) => (
              <div key={module.id} className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-1">{module.name}</p>
                <p className="text-xs text-gray-500 mb-2">{module.recordCount} registro(s)</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(module.id, module.name)}
                  className="w-full"
                >
                  {copiedModule === module.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* JSON Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visualizar JSON Completo</CardTitle>
          <CardDescription className="text-xs">
            Código completo para copiar/colar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedModules.map((module) => (
              <details key={module.id} className="border rounded p-3">
                <summary className="cursor-pointer font-semibold text-sm mb-2">
                  {module.name} ({module.recordCount} registros)
                </summary>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(
                    lastExportData?.data?.[module.id] ??
                      (module.id === 'courses'
                        ? lastExportData?.data?.courses
                        : module.id === 'classes'
                          ? lastExportData?.data?.classes
                          : module.id === 'students'
                            ? lastExportData?.data?.students
                            : module.id === 'companies'
                              ? lastExportData?.data?.companies
                              : module.id === 'products'
                                ? lastExportData?.data?.products
                                : module.id === 'settings'
                                  ? lastExportData?.data?.settings
                                  : module.id === 'documents'
                                    ? lastExportData?.data?.documents
                                    : { module: module.name, recordCount: module.recordCount }),
                    null,
                    2
                  )}
                </pre>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Importante</p>
              <p className="text-xs text-amber-700 mt-1">
                Os backups são exportados em formato JSON e contêm apenas os dados estruturados. 
                Arquivos anexados (documentos, fotos) não são incluídos na exportação. 
                Para backup completo, entre em contato com o suporte técnico.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de uso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">Como usar o backup</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>1.</strong> Clique em "Copiar Backup Completo" ou use os botões individuais</p>
          <p><strong>2.</strong> Cole os dados em um arquivo de texto (.txt ou .json)</p>
          <p><strong>3.</strong> Após resetar o sistema, você poderá reimportar manualmente</p>
          <p className="text-xs text-blue-600 mt-3">
            Dica: Salve o backup em um local seguro antes de resetar os dados!
          </p>
        </CardContent>
      </Card>

      {/* IRATA Data Migration */}
      <IrataDataMigration />

      {/* Download Projeto Completo */}
      <DownloadCompleteProject />

      {/* Clear Data — Danger Zone */}
      <ClearData />
    </div>
  );
}
