import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CommunicationService } from '../communication/communication.service';
import {
  UploadDocumentDto,
  ValidateDocumentDto,
  RejectDocumentDto,
  CheckDocumentsStatusDto,
  GetStudentDocumentsDto,
  SendPendingDocumentsNotificationDto,
} from './dto/student-document.dto';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';

@Injectable()
export class StudentDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationService: CommunicationService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantRls: TenantRlsService,
  ) {}

  /**
   * MASTER/plataforma e rotas públicas (sem tenantId no contexto):
   * comportamento atual sem RLS. Usuários de tenant: transação com RLS
   * armado (role smcorp_rls + app.tenant_id) em students/student_documents
   * como segunda camada de isolamento além do middleware Prisma.
   */
  private async runTenantScoped<T>(
    fn: (client: Prisma.TransactionClient | PrismaService) => Promise<T>,
  ): Promise<T> {
    const { tenantId } = this.tenantContext.get();
    if (!tenantId) return fn(this.prisma);
    return this.tenantRls.withTenantRls(fn);
  }

  private buildDefaultNotificationMessage(
    studentName: string,
    courseName: string,
    pendingDocs: string[],
  ) {
    return `Olá ${studentName}!\n\nIdentificamos documentos pendentes para o curso "${courseName}".\n\n📄 Documentos Pendentes:\n${pendingDocs
      .map((d) => `• ${d}`)
      .join(
        '\n',
      )}\n\nPor favor, acesse seu link de matrícula e envie os documentos faltantes.\n\nAtenciosamente,\nEquipe SMCORP`;
  }

  private async ensureStudentInCompanyScope(studentId: string, companyScopeId?: string) {
    const student = await this.runTenantScoped((client) =>
      client.student.findUnique({
        where: { id: studentId },
        select: { id: true, companyId: true },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    if (!companyScopeId) {
      return student;
    }

    if (!student.companyId || student.companyId !== companyScopeId) {
      throw new ForbiddenException('Acesso negado a documentos de aluno de outra empresa');
    }

    return student;
  }

  /**
   * Faz upload de documento do aluno
   * @param data - Dados do documento
   * @returns StudentDocument criado
   */
  async uploadDocument(data: UploadDocumentDto) {
    // Verificar se o aluno existe
    const student = await this.runTenantScoped((client) =>
      client.student.findUnique({
        where: { id: data.studentId },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Verificar se já existe documento do mesmo tipo pendente/completo
    const existingDoc = await this.runTenantScoped((client) =>
      client.studentDocument.findFirst({
        where: {
          studentId: data.studentId,
          documentType: data.documentType,
          status: {
            in: ['PENDING', 'COMPLETE'],
          },
          deletedAt: null,
        },
      }),
    );

    if (existingDoc) {
      throw new BadRequestException(
        `Já existe um documento do tipo ${data.documentType} aguardando validação ou aprovado. Delete o anterior primeiro.`,
      );
    }

    // Criar documento
    const document = await this.runTenantScoped((client) =>
      client.studentDocument.create({
        data: {
          studentId: data.studentId,
          documentType: data.documentType,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          notes: data.notes,
          status: 'PENDING',
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    );

    // Verificar se precisa atualizar status da matrícula
    await this.updateEnrollmentDocumentsStatus(data.studentId);

    return document;
  }

  /**
   * Valida/Aprova documento do aluno
   * Atualiza enrollment.documentsStatus se todos docs estiverem OK
   * @param data - Dados de validação
   */
  async validateDocument(data: ValidateDocumentDto) {
    // Verificar se validador existe e tem permissão
    const validator = await this.prisma.user.findUnique({
      where: { id: data.validatorId },
    });

    if (!validator) {
      throw new NotFoundException('Validador não encontrado');
    }

    if (!['ADMIN', 'COLLABORATOR', 'MASTER'].includes(validator.role)) {
      throw new ForbiddenException('Apenas ADMIN, COLLABORATOR ou MASTER podem validar documentos');
    }

    // Buscar documento
    const document = await this.runTenantScoped((client) =>
      client.studentDocument.findUnique({
        where: { id: data.documentId },
        include: {
          student: true,
        },
      }),
    );

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.status === 'COMPLETE') {
      throw new BadRequestException('Documento já foi validado anteriormente');
    }

    // Validar documento
    const updated = await this.runTenantScoped((client) =>
      client.studentDocument.update({
        where: { id: data.documentId },
        data: {
          status: 'COMPLETE',
          validatedBy: data.validatorId,
          validatedAt: new Date(),
          rejectedReason: null, // Limpar motivo de rejeição anterior
          notes: data.notes,
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
          validator: {
            select: {
              name: true,
            },
          },
        },
      }),
    );

    // Atualizar status de documentos da matrícula
    await this.updateEnrollmentDocumentsStatus(document.studentId);

    return updated;
  }

  /**
   * Rejeita documento do aluno
   * Aluno precisará fazer novo upload
   * @param data - Dados de rejeição
   */
  async rejectDocument(data: RejectDocumentDto) {
    // Verificar se validador existe
    const validator = await this.prisma.user.findUnique({
      where: { id: data.validatorId },
    });

    if (!validator) {
      throw new NotFoundException('Validador não encontrado');
    }

    if (!['ADMIN', 'COLLABORATOR', 'MASTER'].includes(validator.role)) {
      throw new ForbiddenException(
        'Apenas ADMIN, COLLABORATOR ou MASTER podem rejeitar documentos',
      );
    }

    // Buscar documento
    const document = await this.runTenantScoped((client) =>
      client.studentDocument.findUnique({
        where: { id: data.documentId },
        include: {
          student: true,
        },
      }),
    );

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.status === 'COMPLETE') {
      throw new BadRequestException(
        'Documento já foi aprovado. Revogue a aprovação primeiro se necessário.',
      );
    }

    // Rejeitar documento
    const rejected = await this.runTenantScoped((client) =>
      client.studentDocument.update({
        where: { id: data.documentId },
        data: {
          status: 'REJECTED',
          validatedBy: data.validatorId,
          validatedAt: new Date(),
          rejectedReason: data.rejectedReason,
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
          validator: {
            select: {
              name: true,
            },
          },
        },
      }),
    );

    // Atualizar status de documentos da matrícula
    await this.updateEnrollmentDocumentsStatus(document.studentId);

    return rejected;
  }

  /**
   * Verifica se todos os documentos obrigatórios estão completos
   * Compara com course.requiredDocuments
   * @param data - ID do aluno
   */
  async checkAllDocumentsComplete(data: CheckDocumentsStatusDto, companyScopeId?: string) {
    await this.ensureStudentInCompanyScope(data.studentId, companyScopeId);

    // Buscar matrículas ativas do aluno
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: data.studentId,
        deletedAt: null,
        status: {
          notIn: ['CANCELLED', 'ABSENT'],
        },
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                requiredDocuments: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException('Aluno não possui matrículas ativas');
    }

    // Pegar documentos obrigatórios (usar primeira matrícula como referência)
    const requiredDocs = (enrollments[0].class.course.requiredDocuments as string[]) || [];

    // Buscar documentos aprovados do aluno
    const approvedDocs = await this.runTenantScoped((client) =>
      client.studentDocument.findMany({
        where: {
          studentId: data.studentId,
          status: 'COMPLETE',
          deletedAt: null,
        },
        select: {
          documentType: true,
        },
      }),
    );

    const approvedTypes = approvedDocs.map((d) => d.documentType);

    // Verificar quais docs estão faltando
    const missingDocs = requiredDocs.filter((type) => !approvedTypes.includes(type));

    return {
      allComplete: missingDocs.length === 0,
      requiredDocuments: requiredDocs,
      approvedDocuments: approvedTypes,
      missingDocuments: missingDocs,
    };
  }

  /**
   * Busca documentos do aluno com filtros opcionais
   * @param data - Filtros de busca
   */
  async getStudentDocuments(data: GetStudentDocumentsDto, companyScopeId?: string) {
    await this.ensureStudentInCompanyScope(data.studentId, companyScopeId);

    const documents = await this.runTenantScoped((client) =>
      client.studentDocument.findMany({
        where: {
          studentId: data.studentId,
          documentType: data.documentType,
          status: data.status,
          deletedAt: null,
        },
        include: {
          validator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      }),
    );

    return documents;
  }

  /**
   * Deleta documento (soft delete)
   * @param documentId - ID do documento
   */
  async deleteDocument(documentId: string) {
    const document = await this.runTenantScoped((client) =>
      client.studentDocument.findUnique({
        where: { id: documentId },
      }),
    );

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.status === 'COMPLETE') {
      throw new BadRequestException(
        'Não é possível deletar documento aprovado. Rejeite-o primeiro.',
      );
    }

    const deleted = await this.runTenantScoped((client) =>
      client.studentDocument.update({
        where: { id: documentId },
        data: {
          deletedAt: new Date(),
        },
      }),
    );

    // Atualizar status da matrícula
    await this.updateEnrollmentDocumentsStatus(document.studentId);

    return deleted;
  }

  /**
   * Registra tentativa de notificação de documentos pendentes (WhatsApp/Email)
   */
  async sendPendingDocumentsNotification(
    data: SendPendingDocumentsNotificationDto & {
      documentId: string;
      senderId: string;
    },
  ) {
    const document = await this.runTenantScoped((client) =>
      client.studentDocument.findUnique({
        where: { id: data.documentId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              companyId: true,
            },
          },
        },
      }),
    );

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: document.studentId,
        deletedAt: null,
        status: {
          notIn: ['CANCELLED', 'ABSENT'],
        },
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                name: true,
                requiredDocuments: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException('Aluno não possui matrículas ativas');
    }

    const requiredDocs = (enrollments[0].class.course.requiredDocuments as string[]) || [];

    const approvedDocs = await this.runTenantScoped((client) =>
      client.studentDocument.findMany({
        where: {
          studentId: document.studentId,
          status: 'COMPLETE',
          deletedAt: null,
        },
        select: {
          documentType: true,
        },
      }),
    );

    const approvedTypes = approvedDocs.map((d) => d.documentType);
    const pendingDocs = requiredDocs.filter((type) => !approvedTypes.includes(type));

    if (pendingDocs.length === 0) {
      throw new BadRequestException('Sem documentos pendentes para este aluno');
    }

    const finalMessage =
      data.customMessage?.trim() ||
      this.buildDefaultNotificationMessage(
        document.student.name,
        enrollments[0].class.course.name,
        pendingDocs,
      );

    const relatedCompanyId = enrollments[0]?.class?.companyId || document.student.companyId || null;
    const companySettings = relatedCompanyId
      ? await this.prisma.companySettings.findUnique({
          where: { companyId: relatedCompanyId },
          select: { settings: true },
        })
      : null;

    const settings = (companySettings?.settings || {}) as Record<string, any>;
    const smtpSettings = (settings.smtp || {}) as Record<string, any>;
    const whatsappSettings = (settings.whatsapp || {}) as Record<string, any>;
    const notificationSettings = (settings.notifications || {}) as Record<string, any>;

    const preferredChannel =
      typeof notificationSettings.preferredChannel === 'string'
        ? notificationSettings.preferredChannel.toLowerCase()
        : 'email';
    const smtpConfigured = Boolean(smtpSettings.host && smtpSettings.user);
    const emailEnabledByConfig = notificationSettings.emailOnEnrollment !== false;
    const whatsappEnabledByConfig = whatsappSettings.enabled !== false;

    const channels = {
      whatsapp: {
        requested: data.notificationType === 'whatsapp' || data.notificationType === 'both',
        available: Boolean(document.student.phone) && whatsappEnabledByConfig,
        target: document.student.phone || null,
        enabledByConfig: whatsappEnabledByConfig,
      },
      email: {
        requested: data.notificationType === 'email' || data.notificationType === 'both',
        // Disponível quando o aluno tem e-mail e o canal está habilitado;
        // o envio usa o SMTP do tenant OU a API Uniq Suporte (fallback).
        available: Boolean(document.student.email) && emailEnabledByConfig,
        target: document.student.email || null,
        enabledByConfig: emailEnabledByConfig,
        smtpConfigured,
      },
    };

    const requestedAvailable: Array<'email' | 'whatsapp'> = [];
    if (channels.email.requested && channels.email.available) requestedAvailable.push('email');
    if (channels.whatsapp.requested && channels.whatsapp.available)
      requestedAvailable.push('whatsapp');

    const recommendedChannel = requestedAvailable.includes(preferredChannel as 'email' | 'whatsapp')
      ? (preferredChannel as 'email' | 'whatsapp')
      : requestedAvailable[0] || null;

    // ============================================
    // ENVIO REAL (via CommunicationService)
    // ============================================
    const delivery: Record<
      string,
      { attempted: boolean; sent: boolean; provider?: string; reason?: string }
    > = {
      whatsapp: { attempted: false, sent: false },
      email: { attempted: false, sent: false },
    };

    if (channels.whatsapp.requested && channels.whatsapp.available) {
      const result = await this.communicationService.send({
        tenantId: document.tenantId || undefined,
        channel: 'whatsapp',
        recipient: channels.whatsapp.target!,
        text: finalMessage,
      });
      delivery.whatsapp = {
        attempted: true,
        sent: result.sent,
        provider: result.provider,
        reason: result.reason,
      };
    }

    if (channels.email.requested && channels.email.available) {
      const result = await this.communicationService.send({
        tenantId: document.tenantId || undefined,
        channel: 'email',
        recipient: channels.email.target!,
        subject: `Documentos pendentes - ${enrollments[0].class.course.name}`,
        html: `<p>${finalMessage.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`,
      });
      delivery.email = {
        attempted: true,
        sent: result.sent,
        provider: result.provider,
        reason: result.reason,
      };
    }

    await this.prisma.auditLog.create({
      data: {
        tableName: 'student_document_notifications',
        recordId: document.id,
        action: 'CREATE',
        userId: data.senderId,
        newData: {
          studentId: document.studentId,
          notificationType: data.notificationType,
          pendingDocs,
          channels,
          recommendedChannel,
          preferredChannel,
          message: finalMessage,
          delivery,
          sentAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Notificação processada',
      notificationType: data.notificationType,
      pendingDocuments: pendingDocs,
      previewMessage: finalMessage,
      subject: `Documentos pendentes - ${enrollments[0].class.course.name}`,
      channels,
      preferredChannel,
      recommendedChannel,
      delivery,
    };
  }

  /**
   * Atualiza enrollment.documentsStatus baseado nos documentos do aluno
   * PRIVATE - Chamado internamente após mudanças em documentos
   * @param studentId - ID do aluno
   */
  private async updateEnrollmentDocumentsStatus(studentId: string) {
    // Buscar matrículas ativas
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        deletedAt: null,
        status: {
          notIn: ['CANCELLED', 'ABSENT'],
        },
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                requiredDocuments: true,
              },
            },
          },
        },
      },
    });

    for (const enrollment of enrollments) {
      const requiredDocs = (enrollment.class.course.requiredDocuments as string[]) || [];

      // Se não há documentos obrigatórios, marcar como COMPLETE
      if (requiredDocs.length === 0) {
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { documentsStatus: 'COMPLETE' },
        });
        continue;
      }

      // Verificar documentos aprovados
      const approvedDocs = await this.runTenantScoped((client) =>
        client.studentDocument.findMany({
          where: {
            studentId,
            status: 'COMPLETE',
            deletedAt: null,
          },
          select: {
            documentType: true,
          },
        }),
      );

      const approvedTypes = approvedDocs.map((d) => d.documentType);
      const allComplete = requiredDocs.every((type) => approvedTypes.includes(type));

      // Verificar se há algum rejeitado
      const hasRejected = await this.runTenantScoped((client) =>
        client.studentDocument.findFirst({
          where: {
            studentId,
            status: 'REJECTED',
            deletedAt: null,
          },
        }),
      );

      // Atualizar status
      const newStatus = allComplete ? 'COMPLETE' : hasRejected ? 'REJECTED' : 'PENDING';

      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { documentsStatus: newStatus },
      });
    }
  }
}
