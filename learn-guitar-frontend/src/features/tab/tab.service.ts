import axios from 'axios';
import type { TabDetectionResponse, TabDetectionResult, TabRenderResponse, TabSaveResponse } from './tab.types';

const TAB_API_BASE_URL = import.meta.env.VITE_TAB_API_URL || 'http://localhost:5001';

const tabApi = axios.create({
  baseURL: TAB_API_BASE_URL,
});

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as ApiEnvelope<T>).data ?? {}) as T;
  }

  return payload as T;
}

function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const message = (responseData as { error?: unknown; message?: unknown }).error
        ?? (responseData as { error?: unknown; message?: unknown }).message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Không thể kết nối đến Flask AI API.';
}

export async function detectTabFromImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await tabApi.post('/api/tab/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return unwrapApiData<TabDetectionResponse>(response.data);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function renderTab(payload: TabDetectionResult) {
  try {
    const response = await tabApi.post('/api/tab/render', payload);
    return unwrapApiData<TabRenderResponse>(response.data);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function saveTab(payload: TabDetectionResult) {
  try {
    const response = await tabApi.post('/api/tab/save', payload);
    return unwrapApiData<TabSaveResponse>(response.data);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function getSavedTab(tabId: string) {
  try {
    const response = await tabApi.get(`/api/tab/${tabId}`);
    return unwrapApiData<TabDetectionResult>(response.data);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

/**
 * Gọi Flask AI server tổng hợp WAV từ tab data.
 * Endpoint: POST /api/audio/play với JSON body chứa toàn bộ tab payload.
 * Trả về Blob audio/wav để caller tự quyết định phát trực tiếp hay tải về.
 */
export async function buildAudioFromTab(
  tabData: TabDetectionResult,
  options: { noteDuration?: number; silenceBetween?: number } = {},
): Promise<Blob> {
  const { noteDuration = 0.5, silenceBetween = 0.05 } = options;
  try {
    const response = await tabApi.post(
      '/api/audio/play',
      {
        ...tabData,
        note_duration: noteDuration,
        silence_between: silenceBetween,
      },
      { responseType: 'blob' },
    );
    return response.data as Blob;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
