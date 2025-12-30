
import React from 'react';
import { Message, Sender } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAi = message.sender === Sender.AI;

  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm md:text-base ${
        isAi 
          ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
          : 'bg-indigo-600 text-white rounded-tr-none'
      }`}>
        {isAi && (
          <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <i className="fa-solid fa-robot"></i>
            <span>PipelogicAI</span>
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.text}
        </div>
        <div className={`text-[10px] mt-2 opacity-60 ${isAi ? 'text-gray-400' : 'text-indigo-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
