import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CONFIG from '../../config';

const CinematchScreen: React.FC = () => {
  const navigate = useNavigate();

  const servicesList: string[] = [
    'Netflix', 'Hulu', 'Disney+', 'Apple TV+',
    'Prime Video', 'Max', 'Peacock', 'Paramount+',
    'Showtime', 'ESPN+', 'Crunchyroll', 'Rakuten Viki', 'Kocowa'
  ]


  // Added <number[]> to strictly type the array of selected indices
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Added type annotation for the index parameter
  const toggleService = (index: number): void => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else {
      setSelected([...selected, index]);
    }
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      setError('Please select at least one streaming service to continue.');
      return
    }

    const selectedServices = selected.map(index => servicesList[index]);

    setIsLoading(true);
    setError('');

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError('No user data found. Please sign in again.');
        setIsLoading(false);
        return;
      }

      const payload = {
        services: selectedServices
      };

      const user = JSON.parse(storedUser);
      const apiBase = CONFIG.API_BASE_URL;

      const response = await fetch(`${apiBase}/api/users/${user._id}/services`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if(!response.ok) {
        throw new Error('Failed to save services. Please try again.');
      }

      user.Services = selectedServices;
      localStorage.setItem("user", JSON.stringify(user));

      navigate('/genres');

    } catch (error) {
      console.error('Error occurred while saving user data:', error);
      setError('An error occurred while saving your preferences. Please try again.');
      setIsLoading(false);
    }


  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E85D22] selection:text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-[#222]">
        <div className="text-xl font-bold tracking-[0.2em] text-gray-100">
          CINEMATCH
        </div>
        <div className="text-sm text-gray-400">
          Step <span className="font-bold">1</span> of 3
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 pt-8 pb-12 pt-16 pb-12">
        {/* Eyebrow text */}
        <p className="text-[#E85D22] text-xs font-bold tracking-widest uppercase mb-6">
          Select all that apply
        </p>

        {/* Hero Typography */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-serif tracking-tight leading-none mb-2">
            Pick your
          </h1>
          <h1 className="text-7xl md:text-8xl font-serif italic text-[#E85D22] tracking-tight leading-none">
            services.
          </h1>
        </div>

        <p className="text-gray-400 text-lg mb-12">
          We'll only show you movies you can actually watch
        </p>
        {error && (
                  <div className="mb-6 bg-red-500/10 p-4 rounded-lg border border-red-500/20 flex items-start gap-3">
                      {/* Optional warning icon to make it look nice */}
                      
                      <p className="text-red-500 text-sm leading-relaxed">
                          {error}
                      </p>
                  </div>
              )}

        {/* Replace the grid div with this so each button has their own width depending on their content */}
        <div className="flex flex-wrap gap-4 mb-24">
          {servicesList.map((service, index) => {
            const isSelected = selected.includes(index);
            return (
                <button
                    key={index}
                    onClick={() => toggleService(index)}
                    className={`flex items-center gap-2 py-3 px-6 rounded-full border cursor-pointer transition-all duration-200 ease-in-out
          ${isSelected
                        ? 'border-[#E85D22] text-white bg-[#E85D22]/10'
                        : 'border-[#333] text-gray-300 hover:border-gray-400 hover:text-white'
                    }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#E85D22]' : 'bg-gray-500'}`}></span>
                  <span className="font-semibold text-sm md:text-base">{service}</span>
                </button>
            );
          })}
        </div>


        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-40">
          <div className="text-gray-400 text-lg">
            <span className="text-[#E85D22] font-bold">{selected.length}</span> selected
          </div>
          
          <div className="flex items-center gap-8">
            <button className="text-gray-400 hover:text-white transition-colors font-medium flex items-center gap-2 cursor-pointer">
              <span>&larr;</span> Back
            </button>
            <button className="bg-[#E85D22] hover:bg-[#d04e1b] text-white px-8 py-3.5 rounded-full font-bold transition-colors flex items-center gap-2 cursor-pointer"
            onClick={() => handleContinue()}
            disabled={isLoading}
            >
            {isLoading ? 'Saving...' : <>Continue <span>&rarr;</span></>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CinematchScreen;
