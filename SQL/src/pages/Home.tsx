import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../utils/auth';

declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      navigate('/dashboard');
      return;
    }
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", type: "standard", width: 250 }
        );
      } else {
        console.error('Google API not loaded');
      }
    };

    const interval = setInterval(() => {
      if (window.google && window.google.accounts.id) {
        clearInterval(interval);
        initializeGoogleSignIn();
      }
    }, 100);
  }, [navigate]);

  const handleCredentialResponse =async (response: any) => {
    const idToken = response.credential;
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
    await saveUser(user);
    navigate('/dashboard');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}  
      <div className="relative flex min-h-screen">
        {/* Left Side - Hero Section */}
        <div className="w-3/5 flex flex-col justify-center px-16 py-12">
          <div className="max-w-2xl">
            {/* Logo/Brand */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16M10 11h4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PromptDB
              </h1>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Your Database,
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                Supercharged
              </span>
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Connect to MySQL, PostgreSQL, and SQLite databases. Query with natural language, 
              visualize schemas, and auto-generate REST APIs. All in one powerful platform.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-12">
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span>Natural language to SQL conversion</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-4"></div>
                <span>Visual database schema explorer</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span>Auto-generated REST APIs</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3+</div>
                <div className="text-sm text-gray-400">Database Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="text-sm text-gray-400">Powered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Secure</div>
                <div className="text-sm text-gray-400">& Encrypted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication */}
        <div className="w-2/5 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm border-l border-white/10">
          <div className="w-full max-w-md px-8">
            {/* Welcome Text */}
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">
                Get Started
              </h3>
              <p className="text-gray-300">
                Sign in to access your database management platform
              </p>
            </div>

            {/* Sign In Options */}
            <div className="space-y-4">
              {/* Google Sign In Button */}
                          <div id="googleSignInDiv" className="flex justify-center mb-6"></div>

            </div>

            {/* Footer Text */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-400">
                By continuing, you agree to our{' '}
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/5 rounded-full blur-lg"></div>
    </div>
  );
}