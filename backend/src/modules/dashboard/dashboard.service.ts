import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { EnrollmentStatus } from '@prisma/client';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface FinancialParams extends DateRange {
  groupBy?: 'day' | 'week' | 'month';
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(params: DateRange = {}) {
    const [totalStudents, activeStudents, cashFlowData, occupancyData, companiesCount] =
      await Promise.all([
        // Total de alunos
        this.prisma.student.count({ where: { deletedAt: null } }),

        // Alunos com status presente
        this.prisma.enrollment.count({ where: { status: 'PRESENT' } }),

        // Fluxo de caixa
        this.getCashFlowSummary(),

        // Taxa de ocupação
        this.getOccupancyRate(),

        // Empresas parceiras
        this.prisma.company.count({ where: { isActive: true, deletedAt: null } }),
      ]);

    return {
      totalStudents: {
        value: totalStudents,
        activeCount: activeStudents,
      },
      cashFlow: cashFlowData,
      occupancy: occupancyData,
      companies: {
        total: companiesCount,
        active: companiesCount,
      },
      period: {
        start: params.startDate || null,
        end: params.endDate || null,
      },
    };
  }

  async getStudentsDashboard(_params: DateRange = {}) {
    const [statusCounts, recentEnrollments, topCompanies] = await Promise.all([
      // Contagem por status
      this.prisma.enrollment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Matrículas recentes
      this.prisma.enrollment.findMany({
        take: 10,
        orderBy: { enrolledAt: 'desc' },
        include: {
          student: { select: { name: true } },
          class: {
            select: {
              code: true,
              course: { select: { name: true } },
            },
          },
        },
      }),

      // Top empresas por número de alunos
      this.prisma.company.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { students: true } },
        },
        orderBy: {
          students: { _count: 'desc' },
        },
        take: 5,
      }),
    ]);

    // Transform status counts
    const statusMap: Record<EnrollmentStatus, number> = {
      WAITING_LIST: 0,
      SCHEDULED: 0,
      TO_CONFIRM: 0,
      CONFIRMED: 0,
      PRESENT: 0,
      ABSENT: 0,
      CANCELLED: 0,
    };

    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return {
      byStatus: {
        waitingList: statusMap.WAITING_LIST,
        scheduled: statusMap.SCHEDULED,
        toConfirm: statusMap.TO_CONFIRM,
        confirmed: statusMap.CONFIRMED,
        present: statusMap.PRESENT,
      },
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        studentName: e.student.name,
        classCode: e.class.code,
        courseName: e.class.course.name,
        status: e.status,
        enrolledAt: e.enrolledAt,
      })),
      topCompanies: topCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        studentCount: c._count.students,
      })),
    };
  }

  async getFinancialDashboard(_params: FinancialParams = {}) {
    const [incomeTotal, expenseTotal, pendingPayments, pendingExpenses, overduePayments] =
      await Promise.all([
        // Total de receitas
        this.prisma.payment.aggregate({
          where: { type: 'INCOME', status: 'PAID', deletedAt: null },
          _sum: { amount: true },
        }),

        // Total de despesas
        this.prisma.payment.aggregate({
          where: { type: 'EXPENSE', status: 'PAID', deletedAt: null },
          _sum: { amount: true },
        }),

        // Pagamentos pendentes
        this.prisma.payment.aggregate({
          where: { status: 'PENDING', type: 'INCOME', deletedAt: null },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Despesas pendentes
        this.prisma.payment.aggregate({
          where: { status: 'PENDING', type: 'EXPENSE', deletedAt: null },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Pagamentos em atraso
        this.prisma.payment.aggregate({
          where: { status: 'OVERDUE', type: 'INCOME', deletedAt: null },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

    const income = this.decimalToNumber(incomeTotal._sum.amount);
    const expenses = this.decimalToNumber(expenseTotal._sum.amount);

    return {
      revenue: income,
      expenses: expenses,
      profit: income - expenses,
      pendingPayments: {
        amount: this.decimalToNumber(pendingPayments._sum.amount),
        count: pendingPayments._count.id,
      },
      pendingExpenses: {
        amount: this.decimalToNumber(pendingExpenses._sum.amount),
        count: pendingExpenses._count.id,
      },
      overduePayments: {
        amount: this.decimalToNumber(overduePayments._sum.amount),
        count: overduePayments._count.id,
      },
    };
  }

  async getOperationalDashboard() {
    const [
      activeClasses,
      totalClasses,
      availableRooms,
      totalRooms,
      activeCourses,
      extraProducts,
      occupancyByRoom,
    ] = await Promise.all([
      // Turmas ativas
      this.prisma.class.count({
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, deletedAt: null },
      }),

      // Total de turmas
      this.prisma.class.count({ where: { deletedAt: null } }),

      // Salas disponíveis
      this.prisma.room.count({ where: { isActive: true, deletedAt: null } }),

      // Total de salas
      this.prisma.room.count({ where: { deletedAt: null } }),

      // Cursos ativos
      this.prisma.course.count({ where: { isActive: true, deletedAt: null } }),

      // Produtos extras
      this.prisma.extraProduct.count({ where: { isActive: true, deletedAt: null } }),

      // Ocupação por sala
      this.getOccupancyByRoom(),
    ]);

    const totalCapacity = occupancyByRoom.reduce((sum, r) => sum + r.capacity, 0);
    const totalEnrolled = occupancyByRoom.reduce((sum, r) => sum + r.enrolled, 0);
    const occupancyRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    return {
      classes: {
        active: activeClasses,
        total: totalClasses,
      },
      rooms: {
        available: availableRooms,
        total: totalRooms,
      },
      courses: {
        active: activeCourses,
      },
      extraProducts: {
        count: extraProducts,
      },
      occupancy: {
        rate: Math.round(occupancyRate * 10) / 10,
        totalCapacity,
        totalEnrolled,
        available: totalCapacity - totalEnrolled,
      },
      occupancyByRoom,
    };
  }

  async getCostsDashboard(_params: DateRange = {}) {
    const [costsByCategory, totalCosts] = await Promise.all([
      // Custos por categoria
      this.prisma.cost.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Total de custos
      this.prisma.cost.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    // Custos fixos vs variáveis
    const fixed = costsByCategory.find((c) => c.category === 'FIXED');
    const variable = costsByCategory.find((c) => c.category === 'VARIABLE');

    return {
      totalCosts: this.decimalToNumber(totalCosts._sum.amount),
      byCategory: costsByCategory.map((c) => ({
        category: c.category,
        amount: this.decimalToNumber(c._sum.amount),
        count: c._count.id,
      })),
      fixedCosts: this.decimalToNumber(fixed?._sum.amount ?? null),
      variableCosts: this.decimalToNumber(variable?._sum.amount ?? null),
    };
  }

  // Helper methods
  private async getCashFlowSummary() {
    const [income, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { type: 'INCOME', status: 'PAID', deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { type: 'EXPENSE', status: 'PAID', deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const incomeValue = this.decimalToNumber(income._sum.amount);
    const expensesValue = this.decimalToNumber(expenses._sum.amount);

    return {
      income: incomeValue,
      expenses: expensesValue,
      balance: incomeValue - expensesValue,
    };
  }

  private async getOccupancyRate() {
    const activeClasses = await this.prisma.class.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    const totalCapacity = activeClasses.reduce((sum, c) => sum + c.maxStudents, 0);
    const totalEnrolled = activeClasses.reduce((sum, c) => sum + c._count.enrollments, 0);
    const rate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    return {
      rate: Math.round(rate * 10) / 10,
      activeClasses: activeClasses.length,
      totalCapacity,
      totalEnrolled,
    };
  }

  private async getOccupancyByRoom() {
    const rooms = await this.prisma.room.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        classes: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    return rooms.map((room) => {
      const activeClass = room.classes[0]; // Assuming one active class per room
      const enrolled = activeClass?._count.enrollments || 0;
      const capacity = room.capacity;
      const rate = capacity > 0 ? (enrolled / capacity) * 100 : 0;

      return {
        id: room.id,
        name: room.name,
        code: room.code,
        capacity,
        enrolled,
        available: capacity - enrolled,
        rate: Math.round(rate * 10) / 10,
      };
    });
  }

  private decimalToNumber(value: Decimal | null): number {
    return value ? parseFloat(value.toString()) : 0;
  }
}
