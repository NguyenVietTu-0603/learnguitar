import api from '../../services/api';

export interface AdminStats {
  overview: {
    users: {
      total: number;
      students: number;
      teachers: number;
      admins: number;
      newLast30Days: number;
      newLast7Days: number;
    };
    content: {
      totalCourses: number;
      publishedCourses: number;
      unpublishedCourses: number;
      totalSongs: number;
      totalQuizzes: number;
    };
    engagement: {
      totalEnrollments: number;
      totalProgressRecords: number;
      totalBadges: number;
      totalBadgeUnlocks: number;
      activitiesLast7Days: number;
    };
  };
  topUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    currentStreakDays: number;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    user: { id: string; name: string; email: string } | null;
    course: { id: string; title: string } | null;
    enrolledAt: string;
    status: string;
  }>;
  popularCourses: Array<{
    id: string;
    title: string;
    level: string;
    enrollmentCount: number;
    thumbnailUrl: string;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  isActive: boolean;
  currentStreakDays: number;
  lastLearningDate: string | null;
  createdAt: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return res.data.data;
  },

  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: string;
    search?: string;
  }): Promise<AdminUserListResponse> {
    const res = await api.get<{ success: boolean; data: AdminUserListResponse }>('/admin/users', { params });
    return res.data.data;
  },

  async getUser(userId: string): Promise<AdminUser> {
    const res = await api.get<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}`);
    return res.data.data;
  },

  async updateUser(userId: string, data: {
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
    avatar?: string;
    isActive?: boolean;
  }): Promise<AdminUser> {
    const res = await api.patch<{ success: boolean; message: string; data: AdminUser }>(`/admin/users/${userId}`, data);
    return res.data.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },
};

export default adminService;
