
import { ChatPhase, LeadData, Message, PRDQuestion } from "../types";

interface ChatState {
  phase: ChatPhase;
  messages: Message[];
  lead: LeadData;
  projectDescription: string;
  prdAnswers: Record<string, string>;
  quizStep: number;
  currentReport: string;
}

export const processChatMessage = async (state: ChatState, userMessage: string) => {
  try {
    const response = await fetch('/api/chat/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, userMessage })
    });

    if (!response.ok) throw new Error("Backend error");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return {
      reply: "Вибачте, сталася помилка зв'язку з сервером.",
      nextPhase: state.phase,
      updatedState: state
    };
  }
};

export const submitLeadToBackend = async (state: ChatState) => {
  return await fetch('/api/leads/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
};
