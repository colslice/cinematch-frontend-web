import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setSuccess(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const MarqueeContent = () => (
    <div className="flex items-center space-x-6 px-3">
      <span className="font-serif text-3xl font-bold tracking-tight text-black">CineMatch</span>
      <span className="text-white/70 text-sm">●</span>
      <span className="text-lg text-white"><strong className="text-black">10,000+</strong> movies catalogued</span>
      <span className="text-white/70 text-sm">●</span>
      <span className="font-bold text-lg text-black">Netflix · Hulu · Apple TV+ <span className="font-normal text-white">· 5 more</span></span>
      <span className="text-white/70 text-sm">●</span>
      <span className="font-serif italic text-3xl tracking-tight text-black">Your taste.</span>
      <span className="text-white/70 text-sm">●</span>
      <span className="text-lg text-white"><strong className="text-black">10,000+</strong> movies catalogued</span>
      <span className="text-white/70 text-sm">●</span>
      <span className="font-bold text-lg text-black">Netflix · Hulu · Apple TV+ <span className="font-normal text-white">· 5 more</span></span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: scroll 20s linear infinite; }
      `}</style>

      <div className="flex flex-col lg:flex-row flex-grow">
        <div className="w-full lg:w-1/2 bg-[#F4F1EA] p-8 md:p-16 flex flex-col min-h-[50vh] lg:min-h-0">
          <div className="text-xl font-bold tracking-[0.2em] text-gray-500 mb-36">CINEMATCH</div>
          <div className="mb-12">
            <h1 className="text-7xl md:text-8xl lg:text-[100px] font-serif tracking-tight leading-[0.9] text-black">Forgot your</h1>
            <h1 className="text-7xl md:text-8xl lg:text-[110px] font-serif italic text-[#E85D22] tracking-tight leading-[0.9]">password?</h1>
          </div>
          <p className="text-gray-500 text-lg md:text-xl max-w-md leading-relaxed">
            No worries, we'll send you a link to get back in.
          </p>
          <p className="text-gray-500 text-lg mt-auto text-center w-full flex justify-center items-center gap-2">
            Remembered it?{' '}
            <a href="/login" className="text-[#E85D22] font-bold hover:underline">Back to log in</a>
          </p>
        </div>

        <div className="w-full lg:w-1/2 bg-black p-8 md:p-16 flex flex-col min-h-[50vh] lg:min-h-0 md:pt-36">
          <div className="max-w-xl mx-auto w-full lg:mx-0 lg:ml-12">
            <p className="text-[#E85D22] text-lg font-bold tracking-widest uppercase mb-4">Password Reset</p>
            <h2 className="text-5xl md:text-6xl font-serif tracking-tight text-white mb-6 leading-tight">Let's get you<br />back in.</h2>
            <p className="text-gray-500 text-sm mb-16">We'll email you a link to reset your password</p>

            {success ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                <p className="text-green-400 font-semibold text-lg mb-2">Check your inbox</p>
                <p className="text-gray-400 text-sm">
                  If an account exists for <span className="text-white font-medium">{email}</span>, a reset link is on its way.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-2 font-bold tracking-widest uppercase">Email</p>
                <input type="email" placeholder="eg. johndoe@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full mb-6 px-5 py-3.5 rounded-full bg-[#1e1e1e] border-2 border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D22] focus:border-transparent transition-colors duration-200" />

                {error && (
                  <div className="mb-6 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <button onClick={handleReset} disabled={isLoading}
                  className="w-full py-4 rounded-full bg-[#E85D22] text-white font-bold text-lg hover:bg-[#d0521e] transition-colors duration-200 mb-6">
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </>
            )}

            <button onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mx-auto mt-4">
              <ArrowLeftIcon className="w-4 h-4" />
              Go back to Login
            </button>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#E85D22] overflow-hidden py-4 border-t border-black/10">
        <div className="flex w-max animate-marquee">
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
