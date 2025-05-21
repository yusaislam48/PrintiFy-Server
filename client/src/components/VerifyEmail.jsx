import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const VerifyEmail = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or query parameters
  const email = location.state?.email || new URLSearchParams(location.search).get('email');
  
  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800">Verification Error</h1>
          <p className="text-center text-red-500">
            No email address provided for verification.
          </p>
          <div className="flex justify-center">
            <Link to="/login" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^\d]/g, '');
    setVerificationCode(value);
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    try {
      setResendLoading(true);
      setErrorMessage('');
      
      // Direct API call instead of using auth.resendVerification
      const response = await fetch('http://localhost:8080/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }
      
      toast.success(data.message || 'Verification code sent successfully');
      
      // For development - store the code to display if provided by server
      if (data.code) {
        setDevCode(data.code);
        console.log('DEV: Verification code:', data.code);
      } else {
        setDevCode('');
      }
      
      // Set a 60-second countdown before allowing another resend
      setCountdown(60);
    } catch (error) {
      console.error('Resend error:', error);
      setErrorMessage(error.message || 'Failed to resend verification code');
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }
    
    setErrorMessage('');
    try {
      setLoading(true);
      
      // Direct API call instead of using auth.verify
      const response = await fetch('http://localhost:8080/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code: verificationCode.toString().trim() 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }
      
      // Store tokens
      if (data.token && data.refreshToken) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      toast.success('Email verified successfully!');
      
      // Brief delay before redirect to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error.message || 'Verification failed');
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>
          <p className="mt-2 text-gray-600">
            We've sent a verification code to <span className="font-medium">{email}</span>
          </p>
          <div className="mt-3 text-sm text-gray-500">
            Check your inbox and spam folder for the verification email
          </div>
        </div>

        {/* Development mode code display */}
        {devCode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Dev Mode: Verification code is <span className="font-bold">{devCode}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              placeholder="Enter your 6-digit code"
              value={verificationCode}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !verificationCode || verificationCode.length < 6}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : 'Verify Email'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Didn't receive a code?{' '}
            <button
              onClick={handleResendCode}
              disabled={resendLoading || countdown > 0}
              className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none disabled:opacity-50 disabled:hover:text-blue-600"
            >
              {countdown > 0 
                ? `Resend (${countdown}s)` 
                : resendLoading 
                  ? 'Sending...' 
                  : 'Resend'}
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Having trouble? Contact us at <a href="mailto:support@printify.com" className="text-blue-600 hover:underline">support@printify.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 