"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_URL = '/api';

export default function ChatPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // This state is set but currently only used for authentication tracking
  const [, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      content: "Hello! I'm your Helios Trading Assistant. How can I help you with your meme coin trading today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        console.log('Checking auth status...');
        const response = await fetch(`${API_URL}/authentication/status`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('Auth status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth status data:', data);
          
          if (data.isAuthenticated) {
            console.log('User is authenticated, session ID:', data.sessionId);
            setIsAuthenticated(true);
          } else {
            console.log('User is not authenticated, redirecting to login');
            // Redirect to login page if not authenticated
            router.push('/');
          }
        } else {
          // Redirect to login page if error
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate agent response (in a real app, this would call your API)
    setTimeout(() => {
      // Mock response - in a real app, this would come from your backend
      let agentResponse;
      
      if (inputMessage.toLowerCase().includes('portfolio') || inputMessage.toLowerCase().includes('performance')) {
        agentResponse = {
          sender: 'agent',
          content: "I've analyzed your portfolio. Your meme coin holdings are up 12% today. DOGE is performing particularly well with a 15% gain in the last 24 hours.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (inputMessage.toLowerCase().includes('trade') || inputMessage.toLowerCase().includes('buy') || inputMessage.toLowerCase().includes('sell')) {
        agentResponse = {
          sender: 'agent',
          content: "I can help you execute trades. Would you like me to analyze current trending meme coins or execute a specific trade?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        agentResponse = {
          sender: 'agent',
          content: "I'm your autonomous meme coin trading assistant. I can help you identify trending coins, analyze sentiment, assess risks, and execute trades. What would you like to do?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image 
              src="/helios-logo.svg" 
              alt="Helios Trader Logo" 
              width={40} 
              height={40} 
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Helios Trader</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Link href="/chat" className="text-blue-600 dark:text-blue-400 font-medium">
              Chat
            </Link>
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              Dashboard
            </Link>
            <button 
              onClick={() => window.location.href = `${API_URL}/auth/logout`}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="container mx-auto p-6 h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              message.sender === 'agent' ? (
                /* Agent Message */
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                    A
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%]">
                    <p className="text-gray-800 dark:text-gray-200">
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ) : (
                /* User Message */
                <div key={index} className="flex items-start justify-end">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                    <p className="text-gray-800 dark:text-gray-200">
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {message.timestamp}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white ml-2">
                    U
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your trading assistant..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
