// ============================================
// StudentCard Utilities
// ============================================

import type { Student, Class, Course } from '@/types';
import type { WhatsAppTemplateType } from './types';

// ============================================
// Public enrollment link (no hardcode)
// ============================================

export const getPublicEnrollmentBaseUrl = (): string => {
  const envUrl = (process.env.NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL || '').replace(/\/$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

export const buildEnrollmentLink = (student: Pick<Student, 'code' | 'id'>, baseUrl?: string): string => {
  const resolvedBaseUrl = (baseUrl ?? getPublicEnrollmentBaseUrl()).replace(/\/$/, '');
  return `${resolvedBaseUrl}/enrollment/${student.code}-${student.id}`;
};

/**
 * Creates a local Date from YYYY-MM-DD string
 * Avoids timezone issues by using local time components
 */
export const createLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats phone number for WhatsApp (removes non-digits)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Copies text to clipboard with fallback for iframes/restricted contexts
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to fallback
    }
  }

  return copyToClipboardFallback(text);
};

/**
 * Fallback clipboard copy using execCommand
 */
const copyToClipboardFallback = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
};

/**
 * Calculates enrollment progress percentage
 */
export const calculateEnrollmentProgress = (
  student: Student,
  documentsComplete: boolean
): number => {
  let progress = 0;

  // Link status: Scheduled = 0%, others = +33%
  if (student.linkStatus !== 'Scheduled') {
    progress += 33;
  }

  // Payment status
  if (student.paymentComplete) {
    progress += 33;
  }

  // Documents status
  if (documentsComplete) {
    progress += 34;
  }

  return progress;
};

/**
 * Checks if all documents are approved
 */
export const checkDocumentsComplete = (student: Student): boolean => {
  if (student.documentsComplete) {
    return true;
  }

  if (student.documents && student.documents.length > 0) {
    return student.documents.every((doc) => doc.status === 'Approved');
  }

  return false;
};

/**
 * Generates WhatsApp message based on template type
 */
export const generateWhatsAppMessage = (
  type: WhatsAppTemplateType,
  student: Student,
  classData?: Class,
  course?: Course
): string => {
  const enrollmentLink = buildEnrollmentLink(student);
  const firstName = (student.name || '').split(' ')[0] || 'Aluno';
  const courseName = course?.name || 'curso';
  const classCode = classData?.code || '';

  switch (type) {
    case 'enrollment':
      return `Olá ${firstName}! 👋

Sua matrícula na ${classCode} está confirmada! 🎓

Acesse seu link exclusivo para completar o cadastro e enviar os documentos:
${enrollmentLink}

✅ O que você pode fazer:
• Enviar documentos
• Fazer pagamento
• Acompanhar sua matrícula

Qualquer dúvida, estou à disposição!

Equipe Caiso`;

    case 'documents':
      return `Olá ${firstName}! 📄

Notamos que seus documentos ainda estão pendentes.

Por favor, acesse o link abaixo e envie os documentos necessários:
${enrollmentLink}

⏰ Importante: O prazo para envio é essencial para garantir sua vaga!

Precisa de ajuda? Estou aqui!

Equipe Caiso`;

    case 'payment':
      return `Olá ${firstName}! 💳

Identificamos que o pagamento da sua matrícula está pendente.

Valor: R$ ${(student.totalValue || 0).toFixed(2)}
${student.discount && student.discount > 0 ? `Desconto aplicado: R$ ${student.discount.toFixed(2)}` : ''}

Acesse seu link para realizar o pagamento:
${enrollmentLink}

✅ Formas de pagamento disponíveis no link!

Equipe Caiso`;

    case 'exam':
      if (!student.examStatus?.active) return '';
      const examDate = student.examStatus.date
        ? createLocalDate(student.examStatus.date).toLocaleDateString('pt-BR')
        : '';
      return `Olá ${firstName}! 📝

Lembrando: Sua prova está agendada!

🎯 Detalhes:
• ${student.examStatus.examName || 'Prova'}
• Data: ${examDate}
• Horário: ${student.examStatus.time}
• Código: ${student.examStatus.examNumber}

💡 Dica: Chegue 15 minutos antes!

Boa prova!

Equipe Caiso`;

    case 'welcome':
      const startDate = classData?.startDate
        ? createLocalDate(classData.startDate).toLocaleDateString('pt-BR')
        : '';
      return `Olá ${firstName}! 🎉

Seja bem-vindo(a) à ${classCode}!

📚 Informações importantes:
• Curso: ${courseName}
• Início: ${startDate}
• Horário: ${classData?.schedule || ''}

Seu link de matrícula:
${enrollmentLink}

Estamos ansiosos para ter você conosco!

Equipe Caiso`;

    default:
      return `Olá ${firstName}! Segue o link da sua matrícula: ${enrollmentLink}`;
  }
};

/**
 * Opens WhatsApp with pre-filled message
 */
export const openWhatsApp = (phone: string, message: string): void => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  const whatsappUrl = isMobile
    ? `https://wa.me/55${formattedPhone}?text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=55${formattedPhone}&text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * Gets link status badge styling
 */
export const getLinkStatusStyle = (status: Student['linkStatus']): string => {
  switch (status) {
    case 'Scheduled':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'ToConfirm':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'Present':
      return 'bg-green-100 text-green-700 border-green-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

/**
 * Gets payment status button styling
 */
export const getPaymentButtonStyle = (
  amountPaid: number,
  totalAmount: number,
  allConfirmed: boolean
): string => {
  if (amountPaid === 0) {
    return 'bg-red-50 border-red-500 text-red-700';
  } else if (amountPaid < totalAmount) {
    return 'bg-orange-50 border-orange-500 text-orange-700';
  } else if (amountPaid >= totalAmount && allConfirmed) {
    return 'bg-green-50 border-green-500 text-green-700';
  } else {
    return 'bg-blue-50 border-blue-500 text-blue-700';
  }
};

// ============================================
// Email Utilities
// ============================================

/**
 * Generates email content for a student enrollment link
 */
export const generateEmailContent = (
  student: Student,
  classData?: Class,
  course?: Course
): { subject: string; body: string } => {
  const enrollmentLink = buildEnrollmentLink(student);
  const firstName = (student.name || '').split(' ')[0] || 'Aluno';
  const classCode = classData?.code || '';

  const subject = 'Sua Matrícula na Caiso';
  const body = `Olá ${firstName}! 👋

Sua matrícula na ${classCode} está confirmada! 🎓

Acesse seu link exclusivo para completar o cadastro e enviar os documentos:
${enrollmentLink}

✅ O que você pode fazer:
• Enviar documentos
• Fazer pagamento
• Acompanhar sua matrícula

Qualquer dúvida, estou à disposição!

Equipe Caiso`;

  return { subject, body };
};

/**
 * Tries to open mailto: link, returns false if it fails (popup blocked)
 */
export const openEmailClient = (
  email: string,
  subject: string,
  body: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const newWindow = window.open(mailtoUrl, '_blank');

    // Check after 500ms if the window was successfully opened
    setTimeout(() => {
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        resolve(false); // Failed — need fallback
      } else {
        resolve(true); // Success
      }
    }, 500);
  });
};
