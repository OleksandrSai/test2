
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Sender, PRDQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
Ви — провідний бізнес-аналітик PipelogicAI. 

ВАЖЛИВІ ПРАВИЛА:
1. ПЕРСОНАЛІЗАЦІЯ ТА КОНТЕКСТ: Уважно аналізуйте тип бізнесу клієнта. Якщо це барбершоп — не пропонуйте "SaaS" чи "E-commerce кошик". Функціонал та питання мають бути ТІЛЬКИ релевантним запиту (наприклад, для барбершопу: запис, вибір майстра, програма лояльності).
2. ФАЗА 1 (Тільки строки): Генеруйте опис функцій та ТЕРМІНИ. ЗАБОРОНЕНО вказувати ціни.
3. ФАЗА 2 (Бюджети): Додайте фінансову оцінку до вже описаних варіантів.
4. СТРУКТУРА: Завжди пропонуйте "Базовий (MVP)" та "Просунутий (Scale)" варіанти.
5. МОВА: Українська. Тон: Експертний, діловий.
`;

export const generateResponse = async (history: Message[]) => {
  const contents = history.map(msg => ({
    role: msg.sender === Sender.USER ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text || "Вибачте, сталася помилка.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Технічна помилка.";
  }
};

export const generateDynamicQuestions = async (projectDescription: string): Promise<PRDQuestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `На основі опису проекту: "${projectDescription}", згенеруй 5 конкретних питань для уточнення ТЗ. 
      Питання мають бути максимально релевантними ніші бізнесу. 
      Для кожного питання надай 4 варіанти відповіді. 
      Поверни відповідь СУВОРО у форматі JSON (масив об'єктів PRDQuestion).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["id", "text", "options"]
          }
        },
        systemInstruction: "You are a senior analyst. Generate 5 domain-specific PRD discovery questions. Ensure options are niche-relevant (e.g. if barbershop, ask about booking, staff management, or loyalty). Language: Ukrainian.",
      }
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating dynamic questions:", error);
    // Fallback if AI fails
    return [
      { id: 'goal', text: "Яка основна мета проекту?", options: ["MVP", "Масштабування", "Автоматизація", "Новий стартап"] },
      { id: 'features', text: "Який основний функціонал?", options: ["Запис/Бронювання", "Каталог", "Особистий кабінет", "Адмін-панель"] }
    ];
  }
}

export const generateTimelineReport = async (projectDescription: string, rawNotes: string, userName: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Користувач: ${userName}. 
        Опис проекту: "${projectDescription}".
        Відповіді на уточнення: ${rawNotes}. 
        
        ЗАВДАННЯ: Сформуй два варіанти реалізації (MVP та Full), які СУВОРО відповідають специфіці бізнесу. 
        Вкажи тільки ФУНКЦІОНАЛ та СТРОКИ. ЖОДНИХ ЦІН.`,
        config: {
            systemInstruction: "Expert BA. Provide implementation options strictly tailored to the user's business niche. No generic templates. NO PRICES.",
        }
    });
    return response.text;
}

export const generateBudgetReport = async (timelineContent: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Ось попередній звіт: ${timelineContent}. 
        ЗАВДАННЯ: Додай до кожного варіанту орієнтовний БЮДЖЕТ.`,
        config: {
            systemInstruction: "Expert BA. Add realistic budget estimates to the existing niche-specific options.",
        }
    });
    return response.text;
}
