
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, PRDQuestion, ChatPhase, LeadData } from './types';
import { generateResponse, generateTimelineReport, generateBudgetReport, generateDynamicQuestions } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import PRDPreview from './components/PRDPreview';
import ChoiceSelector from './components/ChoiceSelector';
import MeetingScheduler from './components/MeetingScheduler';

const TEAM_EMAIL = 'alex@ip.net.ua';

const App: React.FC = () => {
  const [phase, setPhase] = useState<ChatPhase>('initial');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: Sender.AI, text: "Привіт! Я AI-асистент PipelogicAI. Допоможу перетворити ідею на ТЗ та отримати естімейт. Опишіть коротко вашу ідею?", timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
  }, [messages, isLoading, phase]);

  const sendEmailToDev = (status: 'full' | 'partial', meetingTime?: string) => {
    const subject = status === 'full' ? `Новий лід: ${lead.name}` : `Незавершений лід: ${lead.name}`;
    const body = {
      client: lead,
      description: projectDescription,
      project: prdAnswers,
      meeting: meetingTime || 'Не обрано (клієнт завершив чат)',
      status: status === 'full' ? 'Завершено' : 'Клієнт не обрав час'
    };
    console.log(`[EMAIL DISPATCH] To: ${TEAM_EMAIL} | Subject: ${subject}`, body);
  };

  const handleSendMessage = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const text = (manualText || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: Sender.USER, text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    switch (phase) {
      case 'initial':
        setProjectDescription(text);
        const dynamicQs = await generateDynamicQuestions(text);
        setQuizQuestions(dynamicQs);
        setPhase('ask_name');
        addAiMessage("Зрозумів, цікава ідея! Перш ніж ми заглибимося в деталі, як мені до вас звертатися?");
        setIsLoading(false);
        break;

      case 'ask_name':
        setLead(prev => ({ ...prev, name: text }));
        setPhase('quiz');
        setQuizStep(0);
        addAiMessage(`${text}, приємно познайомитись! Давайте уточнимо деталі саме для вашого проекту: ${quizQuestions[0]?.text || "З чого почнемо?"}`);
        setIsLoading(false);
        break;

      case 'quiz':
        const currentQ = quizQuestions[quizStep];
        const newAnswers = { ...prdAnswers, [currentQ?.id || quizStep]: text };
        setPrdAnswers(newAnswers);
        
        if (quizStep < quizQuestions.length - 1) {
          const next = quizStep + 1;
          setQuizStep(next);
          addAiMessage(quizQuestions[next].text);
          setIsLoading(false);
        } else {
          const raw = Object.entries(newAnswers).map(([k, v]) => `${k}: ${v}`).join('\n');
          const report = await generateTimelineReport(projectDescription, raw, lead.name);
          setCurrentReport(report);
          addAiMessage(`Дякую! Я проаналізував ваш запит. Ось орієнтовні варіанти реалізації та строки:\n\n${report}`);
          
          setTimeout(() => {
            addAiMessage("Для отримання розрахунку бюджетів, будь ласка, залиште ваш номер телефону:");
            setPhase('ask_contacts');
            setContactSubStep('phone');
          }, 1000);
          setIsLoading(false);
        }
        break;

      case 'ask_contacts':
        if (contactSubStep === 'phone') {
          setLead(prev => ({ ...prev, phone: text }));
          setContactSubStep('email');
          addAiMessage("Прийнято! Тепер ваш контактний Email:");
          setIsLoading(false);
        } else {
          if (!text.includes('@')) {
            addAiMessage("Будь ласка, введіть коректний Email.");
            setIsLoading(false);
            return;
          }
          const updatedLead = { ...lead, email: text };
          setLead(updatedLead);
          
          const budgetReport = await generateBudgetReport(currentReport);
          setCurrentReport(budgetReport);
          addAiMessage(`Готово! Ось повний розрахунок з бюджетами:\n\n${budgetReport}`);
          
          setTimeout(() => {
            addAiMessage("Щоб обговорити ці варіанти, пропоную обрати час для знайомства:");
            setPhase('scheduling');
          }, 1000);
          setIsLoading(false);
        }
        break;

      default:
        const response = await generateResponse([...messages, userMsg]);
        addAiMessage(response);
        setIsLoading(false);
    }
  };

  const addAiMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: Sender.AI, text, timestamp: new Date() }]);
  };

  const handleMeetingSelect = (time: string) => {
    setLead(prev => ({ ...prev, meetingTime: time }));
    setPhase('completed');
    addAiMessage(`Чудово! Час ${time} заброньовано. Ми надіслали підтвердження на ${lead.email}. Дякуємо!`);
    sendEmailToDev('full', time);
    setShowPRD(currentReport);
  };

  const handleSkipMeeting = () => {
    setPhase('completed');
    addAiMessage("Зрозумів. Ми зв'яжемося з вами найближчим часом за вказаними контактами. Дякуємо!");
    sendEmailToDev('partial');
    setShowPRD(currentReport);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-6 font-sans antialiased bg-transparent overflow-hidden">
      
      {/* Floating Chat Window */}
      {!isMinimized && (
        <div className="pointer-events-auto transition-all duration-500 bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden relative w-full max-w-md h-[70vh] md:h-[80vh] border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg backdrop-blur-md">
                <i className="fa-solid fa-bolt-lightning text-emerald-300"></i>
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">PipelogicAI Assistant</h1>
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-100 opacity-80 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Online
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsMinimized(true)} 
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Chat Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 scrollbar-thin scrollbar-thumb-indigo-100">
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
                    <MeetingScheduler onSelect={handleMeetingSelect} onSkip={handleSkipMeeting} />
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

          {/* Input Area */}
          <div className="p-3 bg-white border-t">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  phase === 'ask_name' ? "Вкажіть ваше ім'я..." : 
                  phase === 'ask_contacts' ? (contactSubStep === 'phone' ? "Ваш телефон..." : "Ваш Email...") :
                  phase === 'quiz' ? "Оберіть варіанти..." :
                  "Пишіть тут..."
                }
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

      {/* Minimized Floating Button */}
      {isMinimized && (
        <div 
          onClick={() => setIsMinimized(false)} 
          className="pointer-events-auto relative group flex items-center gap-3 cursor-pointer animate-in zoom-in slide-in-from-bottom-5 duration-300"
        >
          {/* Tooltip-like message preview */}
          <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl shadow-xl border border-indigo-50 text-indigo-900 font-bold text-sm whitespace-nowrap items-center gap-2 transform group-hover:scale-105 transition-transform">
            <span>Потрібна допомога з ТЗ?</span>
            <i className="fa-solid fa-sparkles text-amber-400"></i>
          </div>

          {/* Main Button */}
          <div className="relative w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <i className="fa-solid fa-comment-dots text-2xl"></i>
            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg animate-bounce">
              1
            </div>
          </div>
        </div>
      )}

      {showPRD && <PRDPreview content={showPRD} userEmail={lead.email} onClose={() => setShowPRD(null)} />}
    </div>
  );
};

export default App;
