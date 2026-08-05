'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Clock, FileText, DollarSign, CheckCircle2, CheckSquare } from 'lucide-react';
import { useSettingsStore, ExtraProduct } from '@/stores/settings.store';
import { api } from '@/lib/api';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  syllabus: string | null;
  durationHours: number;
  hoursPerDay: number | null;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  breakDuration: number | null;
  allowWeekends: boolean;
  allowSaturday?: boolean;
  allowSunday?: boolean;
  requiredDocuments: string[] | string | null;
  // DNA Técnico - Campos Adicionais (M01)
  learningTime?: number | null;
  certificationInfo?: string | null;
  prerequisites?: string[] | null;
  price: number;
  cashValue?: number;
  validityMonths: number;
  isOffshore: boolean;
  isActive: boolean;
  linkedProducts?: string[];
  linkedExtras?: string[];
}

interface EditCourseModalProps {
  open: boolean;
  onClose: () => void;
  course: Course;
}

const PREDEFINED_DOCUMENTS = [
  'RG',
  'CPF',
  'Comprovante de Residência',
  'ASO (Atestado de Saúde Ocupacional)',
  'CNH',
  'Certificado de Escolaridade',
  'Foto 3x4',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function EditCourseModal({ open, onClose, course }: EditCourseModalProps) {
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [customDocument, setCustomDocument] = useState('');
  const { extraProducts } = useSettingsStore();

  // Separar produtos e extras do settings store
  const availableProducts = extraProducts.filter((p: ExtraProduct) => p.type === 'product' && p.active);
  const availableExtras = extraProducts.filter((p: ExtraProduct) => p.type === 'extra' && p.active);
  
  const [formData, setFormData] = useState({
    name: course.name,
    code: course.code,
    description: course.description || '',
    syllabus: course.syllabus || '',
    durationHours: course.durationHours,
    hoursPerDay: course.hoursPerDay || 8,
    defaultStartTime: course.defaultStartTime || '08:00',
    defaultEndTime: course.defaultEndTime || '18:00',
    breakDuration: course.breakDuration || 60,
    allowSaturday: course.allowSaturday ?? course.allowWeekends ?? false,
    allowSunday: course.allowSunday ?? course.allowWeekends ?? false,
    requiredDocuments: Array.isArray(course.requiredDocuments) 
      ? course.requiredDocuments 
      : (typeof course.requiredDocuments === 'string' 
          ? (() => { try { return JSON.parse(course.requiredDocuments || '[]'); } catch { return []; } })()
          : []),
    // DNA Técnico - Campos Adicionais (M01)
    learningTime: course.learningTime || null,
    certificationInfo: course.certificationInfo || '',
    prerequisites: Array.isArray(course.prerequisites) 
      ? course.prerequisites 
      : (course.prerequisites ? (() => { try { return JSON.parse(String(course.prerequisites)); } catch { return []; } })() : []),
    price: course.price,
    cashValue: course.cashValue || 0,
    validityMonths: course.validityMonths,
    isOffshore: course.isOffshore,
    isActive: course.isActive,
    linkedProducts: course.linkedProducts || [] as string[],
    linkedExtras: course.linkedExtras || [] as string[],
  });

  const queryClient = useQueryClient();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) return error.message;
    return fallback;
  };

  // Calcular dias estimados
  const estimatedDays = formData.hoursPerDay > 0 
    ? Math.ceil(formData.durationHours / formData.hoursPerDay)
    : 0;

  // Calcular duração diária efetiva
  const calculateDailyHours = () => {
    if (!formData.defaultStartTime || !formData.defaultEndTime) return 0;
    const [startH, startM] = formData.defaultStartTime.split(':').map(Number);
    const [endH, endM] = formData.defaultEndTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const breakMinutes = formData.breakDuration || 0;
    return Math.max(0, (totalMinutes - breakMinutes) / 60);
  };

  const dailyHours = calculateDailyHours();

  const handleUpdate = async () => {
    try {
      setUpdating(true);

      // Validações
      if (!formData.name || !formData.code) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Nome e Código são obrigatórios.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.defaultStartTime && formData.defaultEndTime) {
        if (formData.defaultStartTime >= formData.defaultEndTime) {
          toast({
            title: 'Horários inválidos',
            description: 'Horário de término deve ser maior que o de início.',
            variant: 'destructive',
          });
          return;
        }
      }

      await api.patch(`/courses/${course.id}`,
        {
          ...formData,
          allowWeekends: formData.allowSaturday || formData.allowSunday,
        },
      );

      toast({
        title: 'Curso atualizado!',
        description: 'O DNA técnico do curso foi atualizado com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar curso',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleDocument = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.includes(doc)
        ? prev.requiredDocuments.filter((d: string) => d !== doc)
        : [...prev.requiredDocuments, doc]
    }));
  };

  const addCustomDocument = () => {
    if (customDocument.trim() && !formData.requiredDocuments.includes(customDocument.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, customDocument.trim()]
      }));
      setCustomDocument('');
    }
  };

  const removeCustomDocument = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((d: string) => d !== doc)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Editar DNA Técnico do Curso
          </DialogTitle>
          <DialogDescription>
            Configure todos os parâmetros técnicos do curso {course.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Formulário com Tabs */}
          <div className="flex-1 overflow-y-auto pr-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="schedule">Horários</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="financial">Valores</TabsTrigger>
              </TabsList>

              {/* Tab 1: Informações Básicas */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Curso *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: NR-35 - Trabalho em Altura"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código do Curso *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: C0001"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">Código gerado automaticamente</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Resumo do curso"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syllabus">Conteúdo Programático (Syllabus)</Label>
                  <Textarea
                    id="syllabus"
                    value={formData.syllabus}
                    onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                    placeholder="Descreva o conteúdo detalhado do curso..."
                    rows={6}
                  />
                </div>

                {/* DNA Técnico - Campos Adicionais (M01) */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    DNA Técnico Adicional
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="learningTime">Tempo de Aprendizagem (horas)</Label>
                      <Input
                        id="learningTime"
                        type="number"
                        min="0"
                        value={formData.learningTime || ''}
                        onChange={(e) => setFormData({ ...formData, learningTime: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Ex: 40 horas de estudo prévio"
                      />
                      <p className="text-xs text-muted-foreground">Tempo estimado de aprendizagem/estudo individual</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificationInfo">Informações de Certificação</Label>
                      <Textarea
                        id="certificationInfo"
                        value={formData.certificationInfo}
                        onChange={(e) => setFormData({ ...formData, certificationInfo: e.target.value })}
                        placeholder="Ex: Certificado válido nacionalmente, reconhecido pelo MTE..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Detalhes sobre certificação, validade, órgão emissor</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prerequisiteInput">Pré-requisitos</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="prerequisiteInput"
                            value={customDocument}
                            onChange={(e) => setCustomDocument(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customDocument.trim() && !formData.prerequisites.includes(customDocument.trim())) {
                                  setFormData(prev => ({
                                    ...prev,
                                    prerequisites: [...prev.prerequisites, customDocument.trim()]
                                  }));
                                  setCustomDocument('');
                                }
                              }
                            }}
                            placeholder="Digite e pressione Enter para adicionar"
                          />
                          <Button 
                            type="button"
                            onClick={() => {
                              if (customDocument.trim() && !formData.prerequisites.includes(customDocument.trim())) {
                                setFormData(prev => ({
                                  ...prev,
                                  prerequisites: [...prev.prerequisites, customDocument.trim()]
                                }));
                                setCustomDocument('');
                              }
                            }}
                            variant="outline"
                          >
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.prerequisites.map((prereq: string) => (
                            <div key={prereq} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                              {prereq}
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  prerequisites: prev.prerequisites.filter((p: string) => p !== prereq)
                                }))}
                                className="hover:bg-blue-200 rounded-full p-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Ex: Ensino médio completo, Conhecimento básico de Python</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="durationHours">Carga Horária Total (horas) *</Label>
                    <Input
                      id="durationHours"
                      type="number"
                      min="1"
                      value={formData.durationHours}
                      onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hoursPerDay">Horas de Aula por Dia *</Label>
                    <Input
                      id="hoursPerDay"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.hoursPerDay}
                      onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Curso de ~{estimatedDays} dias</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Curso Offshore</p>
                    <p className="text-xs text-muted-foreground">Específico para operações offshore</p>
                  </div>
                  <Checkbox
                    checked={formData.isOffshore}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOffshore: !!checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Curso Ativo</p>
                    <p className="text-xs text-muted-foreground">Disponível para matrículas</p>
                  </div>
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Configuração de Horários */}
              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultStartTime">Horário de Início</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="defaultStartTime"
                        type="time"
                        value={formData.defaultStartTime}
                        onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultEndTime">Horário de Término</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="defaultEndTime"
                        type="time"
                        value={formData.defaultEndTime}
                        onChange={(e) => setFormData({ ...formData, defaultEndTime: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakDuration">Intervalo (minutos)</Label>
                  <Select
                    value={String(formData.breakDuration)}
                    onValueChange={(value) => setFormData({ ...formData, breakDuration: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium">Dias de Fim de Semana</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Pode ocupar Sábado</p>
                      <p className="text-xs text-muted-foreground">Sábados serão incluídos no cálculo</p>
                    </div>
                    <Switch
                      checked={formData.allowSaturday}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowSaturday: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Pode ocupar Domingo</p>
                      <p className="text-xs text-muted-foreground">Domingos serão incluídos no cálculo</p>
                    </div>
                    <Switch
                      checked={formData.allowSunday}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowSunday: checked })}
                    />
                  </div>
                </div>

                {/* Preview de Horários */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Pré-visualização do Período</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Período de aula:</span>
                      <span className="font-medium">{formData.defaultStartTime} às {formData.defaultEndTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Intervalo:</span>
                      <span className="font-medium">{formData.breakDuration} minutos</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Horas efetivas/dia:</span>
                      <span className="font-medium">{dailyHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sábado:</span>
                      <span className="font-medium">{formData.allowSaturday ? '✅ Permitido' : '❌ Não'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Domingo:</span>
                      <span className="font-medium">{formData.allowSunday ? '✅ Permitido' : '❌ Não'}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Documentos Obrigatórios */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <Label>Documentos Obrigatórios para Matrícula</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione os documentos que o aluno deve enviar via link de matrícula
                  </p>

                  {PREDEFINED_DOCUMENTS.map((doc) => (
                    <div key={doc} className="flex items-center space-x-2">
                      <Checkbox
                        id={doc}
                        checked={formData.requiredDocuments.includes(doc)}
                        onCheckedChange={() => toggleDocument(doc)}
                      />
                      <Label htmlFor={doc} className="text-sm font-normal cursor-pointer">
                        {doc}
                      </Label>
                    </div>
                  ))}

                  {/* Documentos customizados */}
                  {formData.requiredDocuments
                    .filter((doc: string) => !PREDEFINED_DOCUMENTS.includes(doc))
                    .map((doc: string) => (
                      <div key={doc} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm">{doc}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomDocument(doc)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}

                  {/* Adicionar documento customizado */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder="Adicionar documento personalizado..."
                      value={customDocument}
                      onChange={(e) => setCustomDocument(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomDocument()}
                    />
                    <Button onClick={addCustomDocument} variant="outline">
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Preview de documentos selecionados */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Documentos Selecionados ({formData.requiredDocuments.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.requiredDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum documento obrigatório</p>
                    ) : (
                      <ul className="space-y-1">
                        {formData.requiredDocuments.map((doc: string) => (
                          <li key={doc} className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Valores, Vínculo Financeiro e Validade */}
              <TabsContent value="financial" className="space-y-4 mt-4">
                {/* Dados Financeiros - Caixa */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dados Financeiros - Caixa
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashValue">Valor à Vista (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cashValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.cashValue || ''}
                          onChange={(e) => setFormData({ ...formData, cashValue: Number(e.target.value) || 0 })}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validityMonths">Validade do Certificado (meses) *</Label>
                  <Input
                    id="validityMonths"
                    type="number"
                    min="1"
                    value={formData.validityMonths}
                    onChange={(e) => setFormData({ ...formData, validityMonths: Number(e.target.value) })}
                  />
                </div>

                {/* Vínculo Financeiro */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Vínculo Financeiro
                  </h3>

                  {/* Produtos */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-600">Produtos / Valores de Curso</Label>
                    <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                      {availableProducts.length > 0 ? (
                        availableProducts.map((product: ExtraProduct) => (
                          <div key={product.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`product-v2-${product.id}`}
                              checked={formData.linkedProducts.includes(product.id)}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  linkedProducts: checked
                                    ? [...prev.linkedProducts, product.id]
                                    : prev.linkedProducts.filter((id: string) => id !== product.id)
                                }));
                              }}
                            />
                            <label htmlFor={`product-v2-${product.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-blue-600 text-white text-xs">{product.code || 'PV'}</Badge>
                                <span className="text-sm">{product.name}</span>
                              </div>
                              <span className="text-blue-700 font-semibold text-sm">{formatCurrency(product.price)}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Nenhum produto cadastrado no Módulo 00</p>
                      )}
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-600">Produtos Extras</Label>
                    <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                      {availableExtras.length > 0 ? (
                        availableExtras.map((extra: ExtraProduct) => (
                          <div key={extra.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`extra-v2-${extra.id}`}
                              checked={formData.linkedExtras.includes(extra.id)}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  linkedExtras: checked
                                    ? [...prev.linkedExtras, extra.id]
                                    : prev.linkedExtras.filter((id: string) => id !== extra.id)
                                }));
                              }}
                            />
                            <label htmlFor={`extra-v2-${extra.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-purple-600 text-white text-xs">{extra.code || 'EX'}</Badge>
                                <span className="text-sm">{extra.name}</span>
                              </div>
                              <span className="text-purple-700 font-semibold text-sm">{formatCurrency(extra.price)}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Nenhum extra cadastrado no Módulo 00</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Financeiro */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor do curso:</span>
                      <span className="font-medium text-lg">{formatCurrency(formData.price)}</span>
                    </div>
                    {formData.cashValue > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valor à vista:</span>
                        <span className="font-medium text-green-700">{formatCurrency(formData.cashValue)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor por hora:</span>
                      <span className="font-medium">{formatCurrency(formData.durationHours > 0 ? formData.price / formData.durationHours : 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Produtos vinculados:</span>
                      <span className="font-medium">{formData.linkedProducts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Extras vinculados:</span>
                      <span className="font-medium">{formData.linkedExtras.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Validade:</span>
                      <span className="font-medium">{formData.validityMonths} meses</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Lateral do DNA Técnico */}
          <Card className="w-80 overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                DNA Técnico
              </CardTitle>
              <CardDescription className="text-blue-100 text-xs">
                Resumo da configuração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm font-medium">{formData.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="text-sm font-mono">{formData.code}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Carga Horária</p>
                <p className="text-sm">📚 {formData.durationHours}h totais</p>
                <p className="text-sm">📅 {formData.hoursPerDay}h por dia</p>
                <p className="text-sm">⏱️ ~{estimatedDays} dias de curso</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Horários</p>
                <p className="text-sm">🕐 {formData.defaultStartTime} às {formData.defaultEndTime}</p>
                <p className="text-sm">☕ Intervalo de {formData.breakDuration} min</p>
                <p className="text-sm">⚡ {dailyHours.toFixed(1)}h efetivas/dia</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Configurações</p>
                <p className="text-sm">{formData.allowSaturday ? '✅' : '❌'} Sábado</p>
                <p className="text-sm">{formData.allowSunday ? '✅' : '❌'} Domingo</p>
                <p className="text-sm">{formData.isOffshore ? '🛢️' : '🏢'} {formData.isOffshore ? 'Offshore' : 'Onshore'}</p>
                <p className="text-sm">{formData.isActive ? '✅' : '⏸️'} {formData.isActive ? 'Ativo' : 'Inativo'}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Documentos ({formData.requiredDocuments.length})</p>
                {formData.requiredDocuments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum obrigatório</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {formData.requiredDocuments.slice(0, 3).map((doc: string) => (
                      <li key={doc}>✓ {doc}</li>
                    ))}
                    {formData.requiredDocuments.length > 3 && (
                      <li className="text-muted-foreground">+ {formData.requiredDocuments.length - 3} mais</li>
                    )}
                  </ul>
                )}
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Valores</p>
                <p className="text-lg font-bold">{formatCurrency(formData.price)}</p>
                {formData.cashValue > 0 && (
                  <p className="text-xs text-green-700">À vista: {formatCurrency(formData.cashValue)}</p>
                )}
                <p className="text-xs text-muted-foreground">Validade: {formData.validityMonths} meses</p>
                {formData.linkedProducts.length > 0 && (
                  <p className="text-xs">📦 {formData.linkedProducts.length} produto(s)</p>
                )}
                {formData.linkedExtras.length > 0 && (
                  <p className="text-xs">✨ {formData.linkedExtras.length} extra(s)</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer com botões */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={updating}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? 'Salvando...' : 'Salvar DNA Técnico'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
