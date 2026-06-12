'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, BookOpen } from 'lucide-react';

const QUICK_QUESTIONS = [
  'B737 CFM56-7B 엔진 시동 절차는?',
  'Hydraulic leak 비상 절차를 알려줘',
  'Pre-flight inspection 체크리스트',
  'EICAS 경고 메시지 해석 방법',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useDocuments, setUseDocuments] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(docs => setDocCount(docs.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    const aiMsg = { role: 'assistant', content: '' };
    setMessages([...nextMessages, aiMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, useDocuments }),
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: 'assistant', content: accumulated }]);
      }
    } catch {
      setMessages([...nextMessages, {
        role: 'assistant',
        content: '오류가 발생했습니다. .env.local 파일에 GROQ_API_KEY가 설정되어 있는지 확인하세요.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">정비 매뉴얼 Q&A</h2>
        <p className="text-sm text-slate-500">AMM, CMM, FIM 관련 질문을 입력하세요</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-500" />
            </div>
            <p className="font-semibold text-slate-700 text-base">항공정비 AI 비서</p>
            <p className="text-sm mt-1 mb-6">정비 매뉴얼, 절차, 기술 질문을 입력해 보세요</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs text-left p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-colors text-slate-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
            }`}>
              {msg.content || (msg.role === 'assistant' && isLoading && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </span>
              ) : null)}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        {docCount > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setUseDocuments(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                useDocuments
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              문서 참조 {useDocuments ? 'ON' : 'OFF'} ({docCount}개)
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
              title="대화 초기화"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="정비 관련 질문을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 bg-white"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
