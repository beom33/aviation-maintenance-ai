'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, BookOpen, Plus, History, X, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  loadHistory,
  createConversation,
  saveConversation,
  deleteConversation,
  autoTitle,
  formatDate,
} from '@/lib/chatHistory';

const QUICK_QUESTIONS = [
  'B737 CFM56-7B 엔진 시동 절차는?',
  'Hydraulic leak 비상 절차를 알려줘',
  'Pre-flight inspection 체크리스트',
  'EICAS 경고 메시지 해석 방법',
];

export default function ChatPage() {
  const [conv, setConv] = useState(null);          // 현재 대화
  const [conversations, setConversations] = useState([]); // 전체 목록
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useDocuments, setUseDocuments] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const historyRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    const history = loadHistory();
    setConversations(history.conversations);

    if (history.currentId) {
      const current = history.conversations.find(c => c.id === history.currentId);
      setConv(current ?? createConversation());
    } else {
      setConv(createConversation());
    }

    fetch('/api/documents').then(r => r.json()).then(docs => setDocCount(docs.length)).catch(() => {});
  }, []);

  // 메시지 변경 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  // 히스토리 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    if (showHistory) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHistory]);

  const persistConv = (updated) => {
    const titled = { ...updated, title: autoTitle(updated.messages) };
    saveConversation(titled);
    setConv(titled);
    setConversations(loadHistory().conversations);
  };

  const startNewChat = () => {
    const fresh = createConversation();
    setConv(fresh);
    setInput('');
    setShowHistory(false);
  };

  const switchConversation = (target) => {
    setConv(target);
    setShowHistory(false);
    // currentId 업데이트
    saveConversation(target);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const updated = deleteConversation(id);
    setConversations(updated.conversations);
    if (conv?.id === id) {
      const next = updated.conversations[0];
      setConv(next ?? createConversation());
    }
  };

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || isLoading || !conv) return;

    const userMsg = { role: 'user', content };
    const nextMessages = [...conv.messages, userMsg];

    const withUser = { ...conv, messages: nextMessages };
    setConv({ ...withUser, messages: [...nextMessages, { role: 'assistant', content: '' }] });
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, useDocuments }),
      });
      if (!res.ok) throw new Error();

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error();

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setConv(prev => ({
          ...prev,
          messages: [...nextMessages, { role: 'assistant', content: accumulated }],
        }));
      }

      const finalConv = {
        ...withUser,
        messages: [...nextMessages, { role: 'assistant', content: accumulated }],
      };
      persistConv(finalConv);
    } catch {
      const errConv = {
        ...withUser,
        messages: [...nextMessages, { role: 'assistant', content: '오류가 발생했습니다. GROQ_API_KEY를 확인하세요.' }],
      };
      persistConv(errConv);
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

  if (!conv) return null;

  const messages = conv.messages;

  return (
    <div className="flex flex-col h-full">

      {/* 헤더 */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-800 truncate">
            {conv.title || '새 대화'}
          </h2>
          <p className="text-xs text-slate-400">AMM, CMM, FIM 관련 질문</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 이력 버튼 */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showHistory ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              이전 대화 {conversations.length > 0 && `(${conversations.length})`}
            </button>

            {/* 이력 드롭다운 */}
            {showHistory && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">대화 이력</span>
                  <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">저장된 대화가 없습니다</p>
                  ) : (
                    conversations.map(c => (
                      <div
                        key={c.id}
                        onClick={() => switchConversation(c)}
                        className={`w-full flex items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors group cursor-pointer ${
                          c.id === conv.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${c.id === conv.id ? 'text-blue-700' : 'text-slate-700'}`}>
                            {c.title || '새 대화'}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(c.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, c.id)}
                          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 새 대화 버튼 */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            새 대화
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
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
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : msg.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                    code: ({ inline, children }) => inline
                      ? <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      : <code className="block bg-slate-100 text-slate-800 p-3 rounded-lg text-xs font-mono mb-2 overflow-x-auto whitespace-pre">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-3 text-slate-600 mb-2">{children}</blockquote>,
                    table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                    th: ({ children }) => <th className="border border-slate-200 px-2 py-1 bg-slate-50 font-semibold text-left">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
                    hr: () => <hr className="border-slate-200 my-2" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : isLoading && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </span>
              ) : null}
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

      {/* 입력 영역 */}
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
