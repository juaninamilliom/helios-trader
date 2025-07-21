"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const API_URL = '/api';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
            // Redirect to chat page if authenticated
            router.push('/chat');
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/authentication/google`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center">
            <Image
              src="/helios-logo.svg"
              alt="Helios Trader Logo"
              width={120}
              height={120}
              className="mx-auto"
              priority
            />
            <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Helios Trader</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Autonomous Meme Coin Trading Bot</p>
          </div>
          
          <div className="mt-8 space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Secure login required to access trading features</p>
          </div>
        </div>
      </div>
    );
  }

  // Should never reach here as authenticated users are redirected
  return null;
}
