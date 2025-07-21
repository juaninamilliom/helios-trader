"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_URL = '/api';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // This state is set but currently only used for authentication tracking
  const [, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/authentication/status`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
          } else {
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
            <Link href="/chat" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              Chat
            </Link>
            <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 font-medium">
              Dashboard
            </Link>
            <button 
              onClick={() => window.location.href = `${API_URL}/authentication/logout`}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Meme Coin Trading Dashboard</h1>
        
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
              <span className="text-gray-500 dark:text-gray-400">Today&apos;s P/L</span>
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
    </div>
  );
}
