import React, { useState } from 'react';
import { Send, Search, Sparkles, Database } from 'lucide-react';
import { aiService } from '../services/api';

export default function ChatPanel() {
  const [mode, setMode] = useState('chat');
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentQuery = input;
    setInput('');
    setLoading(true);

    try {
      if (mode === 'chat') {
        setChatLog((prev) => [...prev, { role: 'user', content: currentQuery }]);

        const response = await aiService.chat(currentQuery);
        setChatLog((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.response,
            sources: response.data.sources,
          },
        ]);
      } else {
        const response = await aiService.search(currentQuery);
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      if (mode === 'chat') {
        setChatLog((prev) => [...prev, { role: 'assistant', content: 'Error communicating with your second brain.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Sparkles size={18} />
          AI Assistant Panel
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('chat')}
            className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              mode === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            AI Brain Chat
          </button>
          <button
            onClick={() => setMode('search')}
            className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              mode === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semantic Vector Search
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {mode === 'chat' ? (
          <div className="space-y-4">
            {chatLog.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Ask your Second Brain questions referencing your stored context database.
              </div>
            ) : (
              <div className="space-y-3">
                {chatLog.map((msg, idx) => (
                  <div key={`${msg.role}-${idx}`} className={`rounded-3xl p-4 ${msg.role === 'assistant' ? 'bg-slate-50' : 'bg-blue-50/40'}`}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      {msg.role === 'assistant' ? <Database size={16} /> : <Send size={16} />}
                      {msg.role === 'assistant' ? 'Assistant' : 'You'}
                    </div>
                    <p className="text-sm text-slate-800">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 rounded-2xl bg-slate-100 p-3 text-xs text-slate-600">
                        <p className="font-semibold">RAG Citations:</p>
                        <ul className="mt-2 space-y-1">
                          {msg.sources.map((src, sIdx) => (
                            <li key={sIdx}>• {src.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Search concepts semantically. Even if the keyword doesn't match perfectly, vector embeddings will map relevant contexts.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                      <span>{result.title}</span>
                      <span className="text-xs text-slate-500">Match: {(result.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-slate-600">"{result.content}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-600">Gemini thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            {mode === 'chat' ? <Send size={18} /> : <Search size={18} />}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'chat' ? 'Ask your Second Brain...' : 'Search concepts semantically...'}
            className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
