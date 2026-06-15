import axios from 'axios';

export const normalizeApiError = (error: unknown, fallback = 'Không thể kết nối đến máy chủ.'): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
