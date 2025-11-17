import axios from "axios";
import { backendApiUrl } from "./backendApiUrl";
import Cookies from "js-cookie";

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${backendApiUrl}/user/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });
    return response.data.valid;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        Cookies.remove("token");
        return false;
      }
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        console.error("Сервер недоступен. Проверьте подключение к интернету.");
        return false;
      }
    }
    console.error("Ошибка при проверке токена:", error);
    return false;
  }
};
