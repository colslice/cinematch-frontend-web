import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import envelopeImg from '../../assets/envelope.png';
import { auth } from '../../firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import CONFIG from '../../config';

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? 'your email';
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.emailVerified) {
        try {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            await fetch(`${CONFIG.API_BASE_URL}/api/users/${user._id}/toggle/EmailVerified`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' }
            });
            user.EmailVerified = true;
            localStorage.setItem("user", JSON.stringify(user));
          }
          window.location.href = '/services';
        } catch (err) {
          console.error('Failed to update EmailVerified flag:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const interval = setInterval(async () => {
    const user = auth.currentUser;
    if (!user) return;

    await user.reload();

    if (user.emailVerified) {
      window.location.href = '/services';
    }
    }, 3000);

    return () => clearInterval(interval);
    }, []);


  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setResendStatus('error');
      return;
    }
    setResendStatus('sending');
    try {
      await sendEmailVerification(currentUser);
      setResendStatus('sent');
    } catch (err) {
      console.error('Error resending verification:', err);
      setResendStatus('error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black font-sans">
      <header className="flex justify-between items-center px-8 py-6 border-b border-[#222]">
        <p className="text-xl font-bold tracking-[0.2em] text-gray-500">CINEMATCH</p>
        <button onClick={() => navigate('/create')} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Back to sign up
        </button>
      </header>
      <div className="flex-grow flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-xl text-center">
          <div className="flex justify-center mb-8">
            <img src={envelopeImg} alt="Envelope" className="w-40 h-auto" />
          </div>
          <p className="text-[#E85D22] text-xs font-bold tracking-widest uppercase mb-6">Almost There</p>
          <h1 className="text-7xl md:text-8xl font-serif tracking-tight text-white leading-[0.9] mb-2">Check your</h1>
          <h1 className="text-7xl md:text-8xl font-serif italic tracking-tight text-[#E85D22] leading-[0.9] mb-10">inbox.</h1>
          <p className="text-gray-400 text-lg mb-1">we sent a verification link to</p>
          <p className="text-[#E85D22] font-semibold text-lg mb-3">{email}</p>
          <p className="text-gray-400 text-lg mb-10">Click the link to activate your account.</p>
          <div className="border-t border-gray-800 mb-8" />
          <p className="text-gray-400 text-sm">
            Didn't get it?{' '}
            {resendStatus === 'sent' ? (
              <span className="text-green-400 font-semibold">Email sent!</span>
            ) : resendStatus === 'error' ? (
              <span className="text-red-400 font-semibold">Something went wrong. Try again later.</span>
            ) : (
              <button onClick={handleResend} disabled={resendStatus === 'sending'}
                className="text-[#E85D22] font-semibold hover:underline disabled:opacity-50">
                {resendStatus === 'sending' ? 'Sending...' : 'Resend email'}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verify;
