import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';
import type {
  CourseDetail,
  CourseDetailResponse,
  CourseEnrollmentResponse,
  CourseLessonPayload,
  CourseLessonsByLevel,
  CourseLessonsResponse,
  CourseListItem,
  CourseListResponse,
  CourseModule,
  CourseModulePayload,
  CoursePayload,
  CourseQuery,
  CreateDataResponse,
  LessonItem,
  MyCourseItem,
  MyCourseListResponse,
  PaginationMeta,
} from './course.types';

const buildQuery = (query: CourseQuery): string => {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.level) params.set('level', query.level);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const flattenLessons = (course: CourseDetail): LessonItem[] =>
  course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })));

export const courseService = {
  async getCourses(query: CourseQuery = {}): Promise<{ courses: CourseListItem[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<CourseListResponse>(`/courses${buildQuery(query)}`);
      return {
        courses: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async enrollCourse(courseId: string) {
    try {
      const response = await api.post<CourseEnrollmentResponse>('/progress/courses/enroll', { courseId });
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getMyCourses(status?: 'enrolled' | 'completed' | 'paused'):
    Promise<{ items: MyCourseItem[]; pagination: PaginationMeta | null }> {
    try {
      const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await api.get<MyCourseListResponse>(`/progress/courses/me${suffix}`);
      return {
        items: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getContinueLearning(limit = 3): Promise<MyCourseItem[]> {
    try {
      const response = await api.get<{ success: boolean; data: MyCourseItem[] }>(
        `/progress/continue-learning/me?limit=${encodeURIComponent(String(limit))}`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getCourseBySlug(slug: string): Promise<CourseDetail> {
    try {
      const response = await api.get<CourseDetailResponse>(`/courses/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getCourseLessons(slug: string, level?: string): Promise<CourseLessonsByLevel> {
    try {
      const suffix = level ? `?level=${encodeURIComponent(level)}` : '';
      const response = await api.get<CourseLessonsResponse>(`/courses/${slug}/lessons${suffix}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async findLessonBySlug(
    lessonSlug: string,
    courseSlug?: string
  ): Promise<{ course: CourseDetail; module: CourseModule; lesson: LessonItem } | null> {
    const normalizedSlug = lessonSlug.trim().toLowerCase();

    try {
      if (courseSlug) {
        const detail = await this.getCourseBySlug(courseSlug);
        const foundModule = detail.modules.find((module) =>
          module.lessons.some((lesson) => lesson.slug.trim().toLowerCase() === normalizedSlug)
        );

        if (!foundModule) return null;

        const foundLesson = foundModule.lessons.find((lesson) => lesson.slug.trim().toLowerCase() === normalizedSlug);
        if (!foundLesson) return null;

        return {
          course: detail,
          module: foundModule,
          lesson: foundLesson,
        };
      }

      const { courses } = await this.getCourses({ page: 1, limit: 50 });

      for (const course of courses) {
        const detail = await this.getCourseBySlug(course.slug);
        const foundModule = detail.modules.find((module) =>
          module.lessons.some((lesson) => lesson.slug.trim().toLowerCase() === normalizedSlug)
        );

        if (!foundModule) continue;

        const foundLesson = foundModule.lessons.find((lesson) => lesson.slug.trim().toLowerCase() === normalizedSlug);
        if (!foundLesson) continue;

        return {
          course: detail,
          module: foundModule,
          lesson: foundLesson,
        };
      }

      return null;
    } catch (error) {
      throw new Error(normalizeApiError(error, 'Không thể tìm bài học theo slug.'));
    }
  },

  async createCourse(payload: CoursePayload): Promise<CourseListItem> {
    try {
      const response = await api.post<CreateDataResponse<CourseListItem>>('/courses', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createModule(courseId: string, payload: CourseModulePayload): Promise<CourseModule> {
    try {
      const response = await api.post<CreateDataResponse<CourseModule>>(`/courses/${courseId}/modules`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createLesson(courseId: string, moduleId: string, payload: CourseLessonPayload): Promise<LessonItem> {
    try {
      const response = await api.post<CreateDataResponse<LessonItem>>(
        `/courses/${courseId}/modules/${moduleId}/lessons`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  flattenLessons,
};

export default courseService;
