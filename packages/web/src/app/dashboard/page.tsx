import React from 'react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Summary Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Portfolio Value</span>
              <span className="font-medium">$10,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Buying Power</span>
              <span className="font-medium">$5,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Today's P/L</span>
              <span className="font-medium text-green-500">+$250.00</span>
            </div>
          </div>
        </div>
        
        {/* Recent Trades Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">AAPL</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Buy • 10 shares</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$175.50</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Jun 25, 2025</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">MSFT</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sell • 5 shares</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$420.75</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Jun 24, 2025</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Overview Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">S&P 500</span>
              <span className="font-medium text-green-500">+1.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">NASDAQ</span>
              <span className="font-medium text-green-500">+0.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">DOW</span>
              <span className="font-medium text-red-500">-0.3%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Chart visualization will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
