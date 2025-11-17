import { backendApiUrl } from "@/src/utils/backendApiUrl";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Интерфейс для состояния
interface AIState {
  actions: string[];
  loading: boolean;
  error: string | null;
  message: string | null; // Добавляем состояние для полученного сообщения
  imagePath: string | null; // Добавляем состояние для пути к изображению
}

const initialState: AIState = {
  actions: [],
  loading: false,
  error: null,
  message: null, // Изначально сообщение равно null
  imagePath: null, // Изначально путь к изображению равен null
};

// Асинхронное действие для получения действий
export const getActions = createAsyncThunk<string[], string>(
  "ai/getActions",
  async (message, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendApiUrl}/ai/get-actions`,
        {
          message,
        },
        {
          timeout: 15000,
        }
      );
      return response.data.split("!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
          return rejectWithValue("Сервер недоступен. Проверьте подключение к интернету.");
        }
        return rejectWithValue(error.response?.data?.message || "Ошибка при получении действий");
      }
      return rejectWithValue("Произошла неизвестная ошибка");
    }
  }
);

// Асинхронное действие для отправки первого сообщения
export const sendMessageFirst = createAsyncThunk<string, string>(
  "ai/sendMessageFirst",
  async (message, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendApiUrl}/ai/send-message-start`,
        {
          message,
        },
        {
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
          return rejectWithValue("Сервер недоступен. Проверьте подключение к интернету.");
        }
        return rejectWithValue(error.response?.data?.message || "Ошибка при отправке сообщения");
      }
      return rejectWithValue("Произошла неизвестная ошибка");
    }
  }
);

// Асинхронное действие для отправки сообщения
export const sendMessage = createAsyncThunk<
  string,
  { message: string; prompt: string }
>("ai/sendMessage", async ({ message, prompt }, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${backendApiUrl}/ai/send-message`,
      {
        message,
        prompt,
      },
      {
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        return rejectWithValue("Сервер недоступен. Проверьте подключение к интернету.");
      }
      return rejectWithValue(error.response?.data?.message || "Ошибка при отправке сообщения");
    }
    return rejectWithValue("Произошла неизвестная ошибка");
  }
});

// Асинхронное действие для генерации изображения
export const generateImage = createAsyncThunk<string, string>(
  "ai/generateImage",
  async (prompt) => {
    const response = await axios.post(`${backendApiUrl}/ai/generate-img`, {
      prompt,
    });
    console.log("generateImage response:", response.data); // Логируем ответ
    return response.data.imagePath; // Возвращаем путь к изображению
  }
);

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getActions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActions.fulfilled, (state, action) => {
        state.loading = false;
        state.actions = action.payload;
      })
      .addCase(getActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка получения действий";
      })
      .addCase(sendMessageFirst.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessageFirst.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(sendMessageFirst.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error.message || "Ошибка отправки сообщения");
      })
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error.message || "Ошибка отправки сообщения");
      })
      .addCase(generateImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateImage.fulfilled, (state, action) => {
        state.loading = false;
        state.imagePath = action.payload; // Сохраняем путь к изображению
      })
      .addCase(generateImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка генерации изображения";
      });
  },
});

export default aiSlice.reducer;
