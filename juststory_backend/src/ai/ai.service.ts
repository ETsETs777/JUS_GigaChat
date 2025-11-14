import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GigaChat } from "gigachat-node";

@Injectable()
export class AiService {
  private client: GigaChat;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY = 1000;
  private readonly MAX_DELAY = 10000;

  constructor() {
    this.client = new GigaChat({
      clientSecretKey: process.env["AI_TOKEN"],
      isIgnoreTSL: true,
      isPersonal: true,
      autoRefreshToken: true,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    const errorMessage = String(error?.message || error?.toString() || "");
    const statusCode = error?.status || error?.statusCode || error?.response?.status || error?.code;

    return (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("Network error") ||
      errorMessage.includes("connect ETIMEDOUT") ||
      errorMessage.includes("Too Many Requests") ||
      statusCode === 429 ||
      statusCode === 503 ||
      statusCode === 502 ||
      statusCode === 504 ||
      statusCode === "ETIMEDOUT" ||
      statusCode === "ECONNRESET"
    );
  }

  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (typeof error === "string") {
      return error;
    }
    if (error?.toString) {
      return error.toString();
    }
    return "Неизвестная ошибка";
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === this.MAX_RETRIES) {
          const errorMessage = this.getErrorMessage(error);
          throw new HttpException(
            `Ошибка при отправке сообщения - ${errorMessage}`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }

        let delay: number;

        if (error?.status === 429 || error?.statusCode === 429) {
          const retryAfter = error?.response?.headers?.["retry-after"] || 
                           error?.headers?.["retry-after"] ||
                           error?.retryAfter;
          if (retryAfter) {
            delay = parseInt(String(retryAfter)) * 1000;
            if (isNaN(delay)) {
              delay = Math.min(
                this.INITIAL_DELAY * Math.pow(2, attempt + 2),
                this.MAX_DELAY * 2
              );
            }
          } else {
            delay = Math.min(
              this.INITIAL_DELAY * Math.pow(2, attempt + 2),
              this.MAX_DELAY * 2
            );
          }
        } else {
          delay = Math.min(
            this.INITIAL_DELAY * Math.pow(2, attempt),
            this.MAX_DELAY
          );
        }

        await this.sleep(delay);

        console.log(
          `Повторная попытка ${attempt + 1}/${this.MAX_RETRIES} для ${operationName} после задержки ${delay}ms`
        );
      }
    }

    const errorMessage = this.getErrorMessage(lastError);
    throw new HttpException(
      `Ошибка при отправке сообщения - ${errorMessage}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async sendMessageFirst(message: string) {
    return this.executeWithRetry(async () => {
      const response = await this.client.completion({
        model: "GigaChat:latest",
        messages: [
          {
            role: "user",
            content: `Сгенерируй историю кратко минимум 300 символов максимум 500 сама история - ${message} я сам буду делать продолжение истории. Мое приложение это игра story teller где человек  играет и ему дается закончить эту историю  и генерируется потом продолжение истории в зависимости что он выбрал. Не завершай историю а дай мне ее продолжать. Отправь только текст истории которую я засуну в игру`,
          },
        ],
      });
      console.log(response);

      const aiResponse = response.choices[0].message.content;

      const responseObject = {
        message: aiResponse,
      };
      return responseObject;
    }, "sendMessageFirst");
  }

  async sendMessage(message: string, prompt: string) {
    return this.executeWithRetry(async () => {
      const response = await this.client.completion({
        model: "GigaChat:latest",
        messages: [
          {
            role: "user",
            content:
              message +
              `Я хочу сделать это в истории - ${prompt}; вот это и скинь только текст продолжения истории сразу без своих выражений`,
          },
        ],
      });
      console.log(response);

      const aiResponse = response.choices[0].message.content;

      const responseObject = {
        initial: aiResponse,
      };

      return responseObject;
    }, "sendMessage");
  }

  async getActions(message: string) {
    return this.executeWithRetry(async () => {
      const response = await this.client.completion({
        model: "GigaChat:latest",
        messages: [
          {
            role: "user",
            content:
              message +
              "Скинь текст 4 варианта действия в формате [Действие1!Действие2!Действие3!Действие4] отправь действие в формате в квадратных скобках через восклицательный знак, заново текст истории не отправляй, отправь только варианты ответа",
          },
        ],
      });

      const aiResponse = response.choices[0].message.content;

      const responseObject = {
        initial: aiResponse,
      };

      return responseObject;
    }, "getActions");
  }
  // async generateImage(prompt: string) {
  // 	try {
  // 		const response = await this.client.completion({
  // 			model: 'GigaChat:latest',
  // 			messages: [
  // 				{
  // 					role: 'user',
  // 					content: `Нарисуй фото ${prompt}`,
  // 				},
  // 			],
  // 		})

  // 		// Логируем весь ответ для отладки
  // 		console.log('Ответ от API:', response)

  // 		const imageUrl = response.choices[0]?.message?.image // Используем опциональную цепочку
  // 		if (!imageUrl) {
  // 			throw new Error(
  // 				'Изображение не было сгенерировано или отсутствует в ответе.'
  // 			)
  // 		}

  // 		// Сохранение изображения
  // 		const imagePath = path.join(
  // 			__dirname,
  // 			'..',
  // 			'..',
  // 			'public',
  // 			'img',
  // 			`${Date.now()}.png`
  // 		)
  // 		const imageBuffer = Buffer.from(imageUrl, 'base64') // Предполагается, что изображение приходит в формате base64
  // 		fs.writeFileSync(imagePath, imageBuffer)
  // 		return { imagePath: `/img/${path.basename(imagePath)}` } // Возвращаем путь к изображению
  // 	} catch (error) {
  // 		console.error('Ошибка при генерации изображения:', error) // Логируем ошибку
  // 		throw new HttpException(
  // 			`Ошибка при генерации изображения - ${error.message}`,
  // 			HttpStatus.INTERNAL_SERVER_ERROR
  // 		)
  // 	}
  // }
}
