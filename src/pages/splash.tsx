import React from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  // A reusable block for the marquee so we can duplicate it for an infinite loop
  const MarqueeContent = () => (
    <div className="flex items-center space-x-6 px-3 gap-6">
      <span className="font-serif text-3xl font-bold tracking-tight text-black">CineMatch</span>
      <span className="text-white/70 text-sm">●</span>
      <span className="text-lg text-white">
        <strong className="text-black">10,000+</strong> movies catalogued
      </span>
      <span className="text-white/70 text-sm">●</span>
      <span className="font-bold text-lg text-black">
        Netflix · Hulu · Apple TV+ <span className="font-normal text-white">· 5 more</span>
      </span>
      <span className="text-white/70 text-sm">●</span>
      <span className="font-serif italic text-3xl tracking-tight text-black">Your next favorite</span>
      <span className="text-white/70 text-sm">●</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Inline styles for the infinite scrolling marquee. 
        Translating it by -50% pulls the first block completely off-screen, 
        and the second duplicated block seamlessly takes its place.
      */}
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: scroll 20s linear infinite;
          }
        `}
      </style>

      <main className="flex flex-col lg:flex-row flex-grow">
        
        {/* Left Side (Beige) */}
        <div className="w-full lg:w-1/2 bg-[#F4F1EA] p-8 md:p-16 md:pb-24 flex flex-col relative min-h-[50vh] lg:min-h-0">
          {/* Logo / Brand Name */}
          <div className="text-xl font-bold tracking-[0.2em] text-black mb-16 lg:mb-32">
            CINEMATCH
          </div>
          
          {/* Hero Typography */}
          <div className="mb-8 lg:mb-24">
            <h1 className="text-7xl md:text-8xl lg:text-[110px] font-serif tracking-tight leading-[0.9] text-black">
              Your next
            </h1>
            <h1 className="text-7xl md:text-8xl lg:text-[110px] font-serif italic text-[#E85D22] tracking-tight leading-[0.9]">
              favorite
            </h1>
            <h1 className="text-7xl md:text-8xl lg:text-[110px] font-serif tracking-tight leading-[0.9] text-black">
              film.
            </h1>
          </div>

          <p className="text-black text-lg md:text-xl max-w-sm leading-relaxed mb-8 lg:mb-0">
            Smart recommendations filtered to what you can actually stream right now.
          </p>
        </div>

        {/* Right Side (Black) */}
        <div className="w-full lg:w-1/2 bg-black p-8 md:p-16 flex flex-col min-h-[50vh] lg:min-h-0 md:pt-36">
          <div className="max-w-md mx-auto w-full lg:mx-0 lg:ml-12">
            <p className="text-[#E85D22] text-lg font-bold tracking-widest uppercase mb-4">
              Get Started – It's Free
            </p>
            
            <h2 className="text-5xl md:text-6xl font-serif tracking-tight text-white mb-6 leading-tight">
              Find Your <br /> Next Film
            </h2>
            
            <p className="text-gray-300 text-lg mb-12">
              Rate what you've seen. Tell us your streaming services. We do the rest.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col gap-5 mb-20">
              <button className="w-full bg-[#E85D22] hover:bg-[#d04e1b] text-white py-4 px-8 rounded-full font-bold text-xl transition-colors duration-200" onClick={() => navigate('/create')}>
                Create free account
              </button>
              <button className="w-full bg-transparent border-2 border-white hover:bg-white/10 text-white py-4 px-8 rounded-full font-bold text-xl transition-colors duration-200"
                      onClick = {() => navigate('/login')}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- Infinite Scrolling Marquee --- */}
      <div className="w-full bg-[#E85D22] overflow-hidden py-4 border-t border-black/10">
        {/* The w-max ensures the container doesn't squish the text. 
          We render MarqueeContent twice so there is no blank space when it loops.
        */}
        <div className="flex w-max animate-marquee">
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>

    </div>
  );
};

export default SplashScreen;