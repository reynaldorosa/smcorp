'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Mail, Copy, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Student, Class, Course } from '@/types';
import { useCostsStore } from '@/stores/costs.store';
import {
  checkDocumentsComplete,
  generateWhatsAppMessage,
  openWhatsApp,
  generateEmailContent,
  openEmailClient,
  copyToClipboard,
} from './utils';
import type { WhatsAppTemplateType, EmailFallbackData } from './types';

interface WhatsAppDialogProps {
  student: Student;
  classData?: Class;
  course?: Course;
  emailEnabled?: boolean;
}

interface TemplateOption {
  type: WhatsAppTemplateType;
  title: string;
  description: string;
  style?: string;
  condition?: boolean;
}

/**
 * Combined WhatsApp + Email message dialog
 * Sends enrollment links via WhatsApp and/or Email with fallback
 */
export const WhatsAppDialog: React.FC<WhatsAppDialogProps> = ({
  student,
  classData,
  course,
  emailEnabled = true,
}) => {
  const triggerAutomaticCosts = useCostsStore((state) => state.triggerAutomaticCosts);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [emailFallbackData, setEmailFallbackData] = useState<EmailFallbackData>({
    recipient: '',
    subject: '',
    body: '',
  });

  const documentsComplete = checkDocumentsComplete(student);
  const paymentPending = !student.paymentComplete;
  const hasExamScheduled = student.examStatus?.active;

  // Build template options based on student status
  const templates: TemplateOption[] = [
    {
      type: 'welcome',
      title: '🎉 Boas-vindas',
      description: 'Mensagem de boas-vindas com informações da turma',
    },
    {
      type: 'enrollment',
      title: '📋 Link de Matrícula',
      description: 'Enviar link exclusivo para completar cadastro',
    },
  ];

  if (!documentsComplete) {
    templates.push({
      type: 'documents',
      title: '📄 Lembrete de Documentos',
      description: 'Solicitar envio de documentos pendentes',
      style: 'border-yellow-300 bg-yellow-50',
    });
  }

  if (paymentPending) {
    templates.push({
      type: 'payment',
      title: '💳 Lembrete de Pagamento',
      description: 'Solicitar pagamento pendente',
      style: 'border-orange-300 bg-orange-50',
    });
  }

  if (hasExamScheduled) {
    templates.push({
      type: 'exam',
      title: '📝 Confirmação de Prova',
      description: 'Lembrar data e horário da prova agendada',
      style: 'border-blue-300 bg-blue-50',
    });
  }

  // Handle sending via WhatsApp template
  const handleSendWhatsApp = (type: WhatsAppTemplateType) => {
    if (!student.phone) {
      toast.error('Aluno não possui telefone cadastrado.');
      return;
    }
    const message = generateWhatsAppMessage(type, student, classData, course);
    openWhatsApp(student.phone, message);
    toast.success('✅ WhatsApp aberto com mensagem!');
  };

  // Handle sending via Email
  const handleSendEmail = async () => {
    if (!student.email) {
      toast.error('Aluno não possui email cadastrado.');
      return;
    }
    const { subject, body } = generateEmailContent(student, classData, course);
    const success = await openEmailClient(student.email, subject, body);

    if (!success) {
      // Fallback: show dialog with copyable content
      setEmailFallbackData({
        recipient: student.email,
        subject,
        body,
      });
      setShowEmailFallback(true);
    } else {
      toast.success('✅ Cliente de email aberto!');
    }
  };

  // Handle "Enviar Link" with both channels
  const handleSendLink = async () => {
    if (sendViaWhatsApp) {
      handleSendWhatsApp('enrollment');
    }
    if (sendViaEmail) {
      await handleSendEmail();
    }
    if (sendViaWhatsApp || sendViaEmail) {
      triggerAutomaticCosts('LinkSent', {
        studentId: student.id,
        classId: classData?.id,
        courseId: classData?.courseId || course?.id,
        companyId: student.companyId,
        studentExtraProductIds: student.extraProductIds,
      });
    }
  };

  // Copy email body to clipboard
  const handleCopyEmailBody = async () => {
    try {
      await copyToClipboard(emailFallbackData.body);
      toast.success('✅ Corpo do email copiado!');
    } catch {
      toast.error('Erro ao copiar texto.');
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="h-9 w-9 p-0 shrink-0 border-green-300 text-green-700 hover:bg-green-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📱 Enviar Mensagem - {student.name}</DialogTitle>
            <DialogDescription>
              Envie o link de matrícula via WhatsApp e/ou Email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Contact Info */}
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="font-semibold text-green-900 mb-1">📞 Contato</p>
              <p className="text-green-800">{student.phone || 'Sem telefone'}</p>
              {student.email && (
                <p className="text-green-800">✉️ {student.email}</p>
              )}
            </div>

            {/* Send Link Section */}
            <div className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <span className="text-sm font-semibold">Enviar Link de Matrícula:</span>

              {/* WhatsApp checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-whatsapp"
                  checked={sendViaWhatsApp}
                  onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                  disabled={!student.phone}
                />
                <label htmlFor="send-whatsapp" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Enviar por WhatsApp
                  {student.phone ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </label>
              </div>

              {/* Email checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-email"
                  checked={sendViaEmail}
                  onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                  disabled={!student.email || !emailEnabled}
                />
                <label htmlFor="send-email" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Enviar por Email
                  {student.email && emailEnabled ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </label>
              </div>

              {sendViaEmail && (
                <p className="text-xs text-blue-600 ml-6">
                  Abrirá seu cliente de email com mensagem pré-preenchida.
                </p>
              )}

              {/* Send Link Button */}
              <Button
                onClick={handleSendLink}
                disabled={!sendViaWhatsApp && !sendViaEmail}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
              >
                🔗 Enviar Link
              </Button>
            </div>

            {/* WhatsApp Templates Section */}
            <div className="space-y-2">
              <span className="text-sm font-semibold">Templates WhatsApp:</span>

              {templates.map((template) => (
                <Button
                  key={template.type}
                  onClick={() => handleSendWhatsApp(template.type)}
                  variant="outline"
                  className={`w-full justify-start h-auto py-2 ${template.style || ''}`}
                >
                  <div className="text-left">
                    <div
                      className={`font-semibold text-sm ${
                        template.style?.includes('yellow')
                          ? 'text-yellow-700'
                          : template.style?.includes('orange')
                          ? 'text-orange-700'
                          : template.style?.includes('blue')
                          ? 'text-blue-700'
                          : ''
                      }`}
                    >
                      {template.title}
                    </div>
                    <div
                      className={`text-xs ${
                        template.style?.includes('yellow')
                          ? 'text-yellow-600'
                          : template.style?.includes('orange')
                          ? 'text-orange-600'
                          : template.style?.includes('blue')
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="pt-3 border-t text-xs text-gray-500">
              💡 Ao clicar em uma opção, o WhatsApp/Email será aberto com a mensagem
              pré-preenchida.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Fallback Dialog */}
      <Dialog open={showEmailFallback} onOpenChange={setShowEmailFallback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✉️ Enviar Email - {student.name}</DialogTitle>
            <DialogDescription>
              O cliente de email não foi aberto automaticamente. Copie o conteúdo
              abaixo e envie manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
              <p className="font-semibold text-gray-900 mb-1">📧 Destinatário</p>
              <p className="text-gray-800">{emailFallbackData.recipient}</p>
            </div>
            <div className="space-y-2">
              <Label>Assunto:</Label>
              <Input value={emailFallbackData.subject} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Corpo do E-mail:</Label>
              <textarea
                value={emailFallbackData.body}
                readOnly
                className="h-40 w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleCopyEmailBody}
              className="w-full"
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Corpo do E-mail
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
