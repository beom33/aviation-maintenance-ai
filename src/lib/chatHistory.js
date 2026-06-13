const STORAGE_KEY = 'aviation-chat-history';
const MAX_CONVERSATIONS = 20;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { conversations: [], currentId: null };
  } catch {
    return { conversations: [], currentId: null };
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function createConversation() {
  return {
    id: Date.now().toString(),
    title: '',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveConversation(conversation) {
  const history = loadHistory();
  const idx = history.conversations.findIndex(c => c.id === conversation.id);
  const updated = { ...conversation, updatedAt: new Date().toISOString() };

  if (idx >= 0) {
    history.conversations[idx] = updated;
  } else {
    history.conversations.unshift(updated);
    if (history.conversations.length > MAX_CONVERSATIONS) {
      history.conversations = history.conversations.slice(0, MAX_CONVERSATIONS);
    }
  }
  history.currentId = conversation.id;
  saveHistory(history);
}

export function deleteConversation(id) {
  const history = loadHistory();
  history.conversations = history.conversations.filter(c => c.id !== id);
  if (history.currentId === id) {
    history.currentId = history.conversations[0]?.id ?? null;
  }
  saveHistory(history);
  return history;
}

export function autoTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  return first ? first.content.slice(0, 35) + (first.content.length > 35 ? '...' : '') : '새 대화';
}

export function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
