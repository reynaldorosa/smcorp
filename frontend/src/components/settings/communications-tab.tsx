'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { useSettingsStore, type EmailConfig, type WhatsAppConfig } from '@/stores/settings.store';
import { communicationService, type CommunicationStatus } from '@/services/communication.service';

// ============================================
// Component
// ============================================

export function CommunicationsTab() {
  const { emailConfig, whatsappConfig, setEmailConfig, setWhatsappConfig } = useSettingsStore();
  
  // Email form state
  const [emailData, setEmailData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    useSsl: true,
    active: true,
  });

  // WhatsApp form state
  const [whatsappData, setWhatsappData] = useState({
    apiKey: '',
    instanceId: '',
    webhookUrl: '',
    enabled: false,
    number: '',
    defaultMessage: '',
  });

  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

  // Status real da central de notificações no backend (Uniq Suporte Connect API)
  const [backendStatus, setBackendStatus] = useState<CommunicationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    communicationService
      .getStatus()
      .then((status) => {
        setBackendStatus(status);
        // Central já ativa no backend (Uniq Suporte): liga o switch se nunca foi salvo
        setWhatsappData((prev) => (prev.enabled ? prev : { ...prev, enabled: status.uniqSuporteConfigured }));
      })
      .catch(() => setBackendStatus(null))
      .finally(() => setStatusLoading(false));
  }, []);
  useEffect(() => {
    if (emailConfig) {
      setEmailData({
        smtpHost: emailConfig.smtpHost || '',
        smtpPort: emailConfig.smtpPort || 587,
        smtpUser: emailConfig.smtpUser || '',
        smtpPassword: emailConfig.smtpPassword || '',
        fromEmail: emailConfig.fromEmail || '',
        fromName: emailConfig.fromName || '',
        useSsl: emailConfig.useSsl ?? true,
        active: emailConfig.active ?? true,
      });
    }
  }, [emailConfig]);

  useEffect(() => {
    if (whatsappConfig) {
      setWhatsappData({
        apiKey: whatsappConfig.apiKey || '',
        instanceId: whatsappConfig.instanceId || '',
        webhookUrl: whatsappConfig.webhookUrl || '',
        enabled: whatsappConfig.enabled ?? false,
        number: whatsappConfig.number || '',
        defaultMessage: whatsappConfig.defaultMessage || '',
      });
    }
  }, [whatsappConfig]);

  const handleSaveEmail = async () => {
    setIsSavingEmail(true);
    try {
      const data: EmailConfig = {
        id: emailConfig?.id || crypto.randomUUID(),
        smtpHost: emailData.smtpHost,
        smtpPort: emailData.smtpPort,
        smtpUser: emailData.smtpUser,
        smtpPassword: emailData.smtpPassword,
        fromEmail: emailData.fromEmail,
        fromName: emailData.fromName,
        useSsl: emailData.useSsl,
        active: emailData.active,
      };
      setEmailConfig(data);
      toast.success('Configurações de e-mail salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações de e-mail');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    setIsSavingWhatsApp(true);
    try {
      const data: WhatsAppConfig = {
        id: whatsappConfig?.id || crypto.randomUUID(),
        apiKey: whatsappData.apiKey,
        instanceId: whatsappData.instanceId,
        webhookUrl: whatsappData.webhookUrl || undefined,
        enabled: whatsappData.enabled,
        number: whatsappData.number || undefined,
        defaultMessage: whatsappData.defaultMessage || undefined,
      };
      setWhatsappConfig(data);
      toast.success('Configurações do WhatsApp salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações do WhatsApp');
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Configuração de E-mail
              </CardTitle>
              <CardDescription>Configure o servidor SMTP para envio de e-mails automáticos</CardDescription>
            </div>
            {statusLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300">
                <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                <span className="text-xs font-medium text-gray-500">Verificando...</span>
              </div>
            ) : backendStatus?.smtpConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-300">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Ativo (SMTP do tenant)</span>
              </div>
            ) : backendStatus?.uniqSuporteConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-300">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Ativo (Uniq Suporte)</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${emailData.smtpHost ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${emailData.smtpHost ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-medium ${emailData.smtpHost ? 'text-green-700' : 'text-gray-500'}`}>
                  {emailData.smtpHost ? 'Configurado (SMTP)' : 'Não configurado'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-800 mb-1">📧 Funcionalidades</div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Envio de tokens de matrícula</li>
              <li>• Confirmação de inscrição</li>
              <li>• Lembretes de pagamento</li>
              <li>• Avisos de início de curso</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input
                id="smtpHost"
                value={emailData.smtpHost}
                onChange={(e) => setEmailData({ ...emailData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Porta</Label>
              <Input
                id="smtpPort"
                type="number"
                value={emailData.smtpPort}
                onChange={(e) => setEmailData({ ...emailData, smtpPort: parseInt(e.target.value) || 587 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuário</Label>
              <Input
                id="smtpUser"
                value={emailData.smtpUser}
                onChange={(e) => setEmailData({ ...emailData, smtpUser: e.target.value })}
                placeholder="usuario@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Senha/App Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailData.smtpPassword}
                onChange={(e) => setEmailData({ ...emailData, smtpPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">E-mail de Envio</Label>
              <Input
                id="fromEmail"
                type="email"
                value={emailData.fromEmail}
                onChange={(e) => setEmailData({ ...emailData, fromEmail: e.target.value })}
                placeholder="noreply@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">Nome de Exibição</Label>
              <Input
                id="fromName"
                value={emailData.fromName}
                onChange={(e) => setEmailData({ ...emailData, fromName: e.target.value })}
                placeholder="SMCORP Treinamentos"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="useSsl"
              checked={emailData.useSsl}
              onCheckedChange={(checked) => setEmailData({ ...emailData, useSsl: checked })}
            />
            <Label htmlFor="useSsl">Usar SSL/TLS</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="emailActive"
              checked={emailData.active}
              onCheckedChange={(checked) => setEmailData({ ...emailData, active: checked })}
            />
            <Label htmlFor="emailActive">Ativar Envio de E-mail</Label>
          </div>
          <Button onClick={handleSaveEmail} disabled={isSavingEmail} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Save className="h-4 w-4" />
            {isSavingEmail ? 'Salvando...' : 'Salvar Configurações de E-mail'}
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Configuração do WhatsApp
              </CardTitle>
              <CardDescription>Central de notificações — envio via Uniq Suporte Connect API (WhatsApp, SMS e E-mail) e SMTP do tenant</CardDescription>
            </div>
            {statusLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300">
                <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                <span className="text-xs font-medium text-gray-500">Verificando...</span>
              </div>
            ) : backendStatus?.uniqSuporteConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-300">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Conectado (Uniq Suporte)</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${whatsappData.enabled ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${whatsappData.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-medium ${whatsappData.enabled ? 'text-green-700' : 'text-gray-500'}`}>
                  {whatsappData.enabled ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-medium text-green-800 mb-1">💬 Funcionalidades</div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Central de Vendas (Módulo 05)</li>
              <li>• Atendimento a leads</li>
              <li>• Envio de informações de cursos</li>
              <li>• Follow-up automatizado</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">Numero</Label>
              <Input
                id="whatsappNumber"
                value={whatsappData.number}
                onChange={(e) => setWhatsappData({ ...whatsappData, number: e.target.value })}
                placeholder="55 11 99999-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={whatsappData.apiKey}
                onChange={(e) => setWhatsappData({ ...whatsappData, apiKey: e.target.value })}
                placeholder="Sua API Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instanceId">Instance ID</Label>
              <Input
                id="instanceId"
                value={whatsappData.instanceId}
                onChange={(e) => setWhatsappData({ ...whatsappData, instanceId: e.target.value })}
                placeholder="ID da instância"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (opcional)</Label>
              <Input
                id="webhookUrl"
                value={whatsappData.webhookUrl}
                onChange={(e) => setWhatsappData({ ...whatsappData, webhookUrl: e.target.value })}
                placeholder="https://sua-api.com/webhook"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="defaultMessage">Mensagem Padrao</Label>
              <Textarea
                id="defaultMessage"
                value={whatsappData.defaultMessage}
                onChange={(e) => setWhatsappData({ ...whatsappData, defaultMessage: e.target.value })}
                placeholder="Mensagem padrao para contatos"
                rows={3}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="whatsappEnabled"
              checked={whatsappData.enabled}
              onCheckedChange={(checked) => setWhatsappData({ ...whatsappData, enabled: checked })}
            />
            <Label htmlFor="whatsappEnabled">Ativar Integração</Label>
          </div>
          <Button onClick={handleSaveWhatsApp} disabled={isSavingWhatsApp} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Save className="h-4 w-4" />
            {isSavingWhatsApp ? 'Salvando...' : 'Salvar Configurações do WhatsApp'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-yellow-600 text-2xl">💡</div>
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Nota Importante</h4>
              <p className="text-sm text-yellow-700">
                A central de notificações está ativa: e-mails, SMS e WhatsApp são enviados pela Uniq Suporte Connect API (chave configurada no backend).
                Os campos abaixo servem para credenciais adicionais do tenant, como SMTP próprio — quando preenchidos, o envio de e-mail passa a usar o SMTP do tenant com fallback automático para a Uniq Suporte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
