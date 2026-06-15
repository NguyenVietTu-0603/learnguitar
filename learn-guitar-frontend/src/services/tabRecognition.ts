import axios from 'axios';

const TAB_API_URL = import.meta.env.VITE_TAB_API_URL || 'http://localhost:5001';

const tabApi = axios.create({
  baseURL: TAB_API_URL,
});

function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const apiError = (responseData as { error?: unknown }).error;
      const apiTraceback = (responseData as { traceback?: unknown }).traceback;

      if (typeof apiError === 'string' && apiError.trim()) {
        return apiTraceback && typeof apiTraceback === 'string'
          ? `${apiError}\n\n${apiTraceback}`
          : apiError;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Không thể kết nối đến Flask API.';
}

export async function predictTabFromImage(file: File, confThresh: number) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('conf_thresh', String(confThresh));

  console.log('[tabRecognition] preparing request', {
    url: `${TAB_API_URL}/predict`,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    confThresh,
  });

  try {
    const response = await tabApi.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('[tabRecognition] response received', {
      status: response.status,
      success: response.data?.success,
      hasResults: Boolean(response.data?.results),
      error: response.data?.error,
    });

    return response.data;
  } catch (error) {
    console.error('[tabRecognition] request failed', error);
    throw new Error(extractApiError(error));
  }
}
