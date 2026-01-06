
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, PRDQuestion, ChatPhase, LeadData } from './types';
import { processChatMessage, submitLeadToBackend } from './services/apiService';
import ChatBubble from './components/ChatBubble';
import PRDPreview from './components/PRDPreview';
import ChoiceSelector from './components/ChoiceSelector';
import MeetingScheduler from './components/MeetingScheduler';

const App: React.FC = () => {
  const [phase, setPhase] = useState<ChatPhase>('initial');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: Sender.AI, text: "Привіт! Я AI-асистент PipelogicAI. Допоможу перетворити ідею на ТЗ та отримати естімейт. Опишіть коротко вашу ідею?", timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showPRD, setShowPRD] = useState<string | null>(null);

  const [lead, setLead] = useState<LeadData>({ name: '', phone: '', email: '' });
  const [projectDescription, setProjectDescription] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<PRDQuestion[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [prdAnswers, setPrdAnswers] = useState<Record<string, string>>({});
  const [currentReport, setCurrentReport] = useState('');
  const [contactSubStep, setContactSubStep] = useState<'phone' | 'email'>('phone');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const getCurrentState = () => ({
    phase, messages, lead, projectDescription, prdAnswers, quizStep, currentReport
  });

  const handleSendMessage = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const text = (manualText || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: Sender.USER, text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // CALL BACKEND
    const result = await processChatMessage(getCurrentState() as any, text);

    if (result.updatedState) {
        if (result.updatedState.lead) setLead(result.updatedState.lead);
        if (result.updatedState.projectDescription) setProjectDescription(result.updatedState.projectDescription);
    }

    if (result.quizQuestions) setQuizQuestions(result.quizQuestions);
    if (result.nextPhase) setPhase(result.nextPhase);

    addAiMessage(result.reply);
    setIsLoading(false);
  };

  const addAiMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: Sender.AI, text, timestamp: new Date() }]);
  };

  const handleMeetingSelect = async (time: string) => {
    setLead(prev => ({ ...prev, meetingTime: time }));
    setPhase('completed');
    addAiMessage(`Чудово! Час ${time} заброньовано. Дякуємо!`);
    await submitLeadToBackend(getCurrentState() as any);
    setShowPRD(currentReport);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-6 font-sans antialiased bg-transparent overflow-hidden">
      {!isMinimized && (
        <div className="pointer-events-auto transition-all duration-500 bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden relative w-full max-w-md h-[70vh] md:h-[80vh] border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg backdrop-blur-md">
                <i className="fa-solid fa-bolt-lightning text-emerald-300"></i>
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">PipelogicAI Assistant (API-Powered)</h1>
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-100 opacity-80 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Connected to Backend
                </div>
              </div>
            </div>
            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <ChatBubble message={msg} />
                {phase === 'quiz' && msg.sender === Sender.AI && idx === messages.length - 1 && !isLoading && (
                  <div className="ml-8">
                    <ChoiceSelector
                      options={quizQuestions[quizStep]?.options || []}
                      onSelect={(opt) => handleSendMessage(undefined, opt)}
                      onOther={() => inputRef.current?.focus()}
                    />
                  </div>
                )}
                {phase === 'scheduling' && msg.sender === Sender.AI && idx === messages.length - 1 && (
                  <div className="ml-8">
                    <MeetingScheduler onSelect={handleMeetingSelect} onSkip={() => setShowPRD(currentReport)} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start px-2">
                <div className="bg-white border p-2 rounded-xl rounded-tl-none flex gap-1 shadow-sm">
                  <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Введіть ваше повідомлення..."
                className="w-full py-3 px-4 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1.5 top-1.5 w-8 h-8 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {isMinimized && (
        <div onClick={() => setIsMinimized(false)} className="pointer-events-auto relative group flex items-center gap-3 cursor-pointer">
          <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl shadow-xl border border-indigo-50 text-indigo-900 font-bold text-sm whitespace-nowrap items-center gap-2 transform group-hover:scale-105 transition-transform">
            <span>Обговорити проект?</span>
            <i className="fa-solid fa-sparkles text-amber-400"></i>
          </div>
          <div className="relative w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <i className="fa-solid fa-comment-dots text-2xl"></i>
          </div>
        </div>
      )}

      {showPRD && <PRDPreview content={showPRD} userEmail={lead.email} onClose={() => setShowPRD(null)} />}
    </div>
  );
};

export default App;
