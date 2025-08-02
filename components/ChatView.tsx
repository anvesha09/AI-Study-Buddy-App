import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, AppContext } from '../types';
import { geminiService } from '../services/geminiService';
import Spinner from './Spinner';
import Icon from './Icon';

interface ChatViewProps {
  context: AppContext;
}

const ChatView: React.FC<ChatViewProps> = ({ context }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (context) {
        setIsInitializing(true);
        setChat(null);
        setMessages([]);
        setError('');
        const newChat = await geminiService.initChat(context);
        setChat(newChat);
        setMessages([{ role: 'model', text: "Hello! I've loaded your document. Ask me anything about it." }]);
        setIsInitializing(false);
      } else {
        setChat(null);
        setMessages([]);
        setError("Please provide a document in the 'Content' tab to start a chat.");
      }
    };
    initializeChat();
  }, [context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessageStream({ message: currentMessage });
      let modelResponseText = '';
      setMessages(prev => [...prev, { role: 'model', text: '...' }]); 

      for await (const chunk of response) {
        modelResponseText += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', text: modelResponseText };
            return newMessages;
        });
      }

    } catch (e) {
      console.error("Chat error:", e);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, currentMessage, isLoading]);

  if (isInitializing) {
    return (
        <div className="h-full flex flex-col justify-center items-center p-6 bg-white rounded-xl shadow-md">
            <Spinner />
            <p className="mt-4 text-slate-600 font-medium">Preparing your chat...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-white rounded-xl shadow-md">
       <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">Contextual Chat</h3>
      {error && <div className="p-4 text-center text-slate-500">{error}</div>}
      
      {!error && (
         <>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>}
                    <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                     {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold flex-shrink-0">You</div>}
                </div>
                ))}
                {isLoading && messages[messages.length-1].role === 'user' && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                        <div className="max-w-lg p-3 rounded-xl bg-slate-100 text-slate-800">
                           <Spinner/>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="relative">
                <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Ask a question about the document..."
                    className="w-full p-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    rows={2}
                    disabled={!chat || isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!chat || isLoading || !currentMessage.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    <Icon icon="send" className="w-5 h-5" />
                </button>
                </div>
            </div>
         </>
      )}
    </div>
  );
};

export default ChatView;