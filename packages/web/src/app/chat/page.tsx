import React from 'react';

export default function ChatPage() {
  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Trading Agent Chat</h1>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Agent Message */}
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
              A
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%]">
              <p className="text-gray-800 dark:text-gray-200">
                Hello! I&apos;m your Helios Trading Assistant. How can I help you
                with your trading today?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                10:30 AM
              </p>
            </div>
          </div>

          {/* User Message */}
          <div className="flex items-start justify-end">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
              <p className="text-gray-800 dark:text-gray-200">
                Can you show me my current portfolio performance?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                10:31 AM
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white ml-2">
              U
            </div>
          </div>

          {/* Agent Message with Data */}
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
              A
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%]">
              <p className="text-gray-800 dark:text-gray-200">
                Here&apos;s your current portfolio summary:
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md mt-2 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Portfolio Value
                    </span>
                    <span className="font-medium">$10,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Today&apos;s P/L
                    </span>
                    <span className="font-medium text-green-500">
                      +$250.00 (2.5%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Total Return
                    </span>
                    <span className="font-medium text-green-500">
                      +$1,200.00 (12%)
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                10:32 AM
              </p>
            </div>
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Ask your trading assistant..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
