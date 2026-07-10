import { useState } from 'react';
import { chatbotApi } from '../services/api';

const suggestedQuestions = [
  "How many products are in stock?",
  "Which products are low on stock?",
  "How many users are in the system?",
  "What is the total inventory value?",
  "Which category has the most products?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (question?: string) => {
    if (loading) return; // Prevent duplicate requests
    const msg = question || input;
    if (!msg.trim()) return;
    
    setError(null);
    const userMessage = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatbotApi.chat(msg);
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (err: unknown) {
      console.error(err);
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const friendlyMessage = typeof message === 'string' 
        ? message 
        : "Failed to connect to the chatbot service. Please ensure the backend is running and try again.";
      setError(friendlyMessage);
      setMessages(prev => [...prev, { role: 'bot', text: "Error: Could not retrieve a response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🤖 Inventory Assistant</h1>
      <p className="text-gray-500 mb-4">Ask anything about your inventory!</p>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => sendMessage(q)}
            className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm hover:bg-blue-100 transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Chat Box */}
      <div className="bg-white rounded-lg shadow p-4 h-80 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-28"> Select a question above or type below!</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-500">Thinking... ⏳ </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="Ask..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          onClick={() => sendMessage()}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}