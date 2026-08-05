import api from '@/lib/api';

interface DashboardSummary {
  totalStudents: {
    value: number;
    activeCount: number;
  };
  cashFlow: {
    income: number;
    expenses: number;
    balance: number;
  };
  occupancy: {
    rate: number;
    activeClasses: number;
    totalCapacity: number;
    totalEnrolled: number;
  };
  companies: {
    total: number;
    active: number;
  };
}

interface StudentsDashboard {
  byStatus: {
    scheduled: number;
    toConfirm: number;
    confirmed: number;
    present: number;
  };
  recentEnrollments: Array<{
    id: string;
    studentName: string;
    classCode: string;
    courseName: string;
    status: string;
    enrolledAt: string;
  }>;
  topCompanies: Array<{
    id: string;
    name: string;
    tradeName: string | null;
    studentCount: number;
  }>;
}

interface OperationalDashboard {
  classes: {
    active: number;
    total: number;
  };
  rooms: {
    available: number;
    total: number;
  };
  courses: {
    active: number;
  };
  extraProducts: {
    count: number;
  };
  occupancy: {
    rate: number;
    totalCapacity: number;
    totalEnrolled: number;
    available: number;
  };
  occupancyByRoom: Array<{
    id: string;
    name: string;
    code: string;
    capacity: number;
    enrolled: number;
    available: number;
    rate: number;
  }>;
}

interface FinancialDashboard {
  revenue: number;
  expenses: number;
  profit: number;
  pendingPayments: {
    amount: number;
    count: number;
  };
  pendingExpenses: {
    amount: number;
    count: number;
  };
  overduePayments: {
    amount: number;
    count: number;
  };
}

interface CostsDashboard {
  totalCosts: number;
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  fixedCosts: number;
  variableCosts: number;
}

export const dashboardService = {
  async getSummary(params?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>('/dashboard/summary', { params });
    return response.data;
  },

  async getStudents(params?: { startDate?: string; endDate?: string }): Promise<StudentsDashboard> {
    const response = await api.get<StudentsDashboard>('/dashboard/students', { params });
    return response.data;
  },

  async getOperational(): Promise<OperationalDashboard> {
    const response = await api.get<OperationalDashboard>('/dashboard/operational');
    return response.data;
  },

  async getFinancial(params?: { startDate?: string; endDate?: string }): Promise<FinancialDashboard> {
    const response = await api.get<FinancialDashboard>('/dashboard/financial', { params });
    return response.data;
  },

  async getCosts(params?: { startDate?: string; endDate?: string }): Promise<CostsDashboard> {
    const response = await api.get<CostsDashboard>('/dashboard/costs', { params });
    return response.data;
  },
};
