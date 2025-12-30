
import React from 'react';

interface PRDPreviewProps {
  content: string;
  userEmail: string;
  onClose: () => void;
}

const PRDPreview: React.FC<PRDPreviewProps> = ({ content, userEmail, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <i className="fa-solid fa-file-invoice text-emerald-400"></i>
            Попередній Звіт & ТЗ
          </h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-2">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-8 flex items-start gap-4">
             <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                <i className="fa-solid fa-paper-plane"></i>
             </div>
             <div>
               <h4 className="font-bold text-emerald-900">Дані успішно відправлено!</h4>
               <p className="text-sm text-emerald-800 opacity-90">
                 Копія ТЗ та попередній розрахунок надіслані на <strong>alex@ip.net.ua</strong> та на вашу адресу <strong>{userEmail}</strong>.
               </p>
             </div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="prose prose-indigo max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm md:text-base">
                    {content}
                </pre>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Зберегти PDF
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default PRDPreview;
