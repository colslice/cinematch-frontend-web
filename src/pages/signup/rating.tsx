import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import CONFIG from '../../config';

const RateMoviesScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const [isCardShrunk, setIsCardShrunk] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number | 'skipped'>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [movieQueue, setMovieQueue] = useState<any[]>([]);
  const [isFetchingMovies, setIsFetchingMovies] = useState(true);

  const currentMovie = movieQueue[currentIndex];
  const totalMovies = movieQueue.length; 
  const isFinished = totalMovies > 0 && currentIndex >= totalMovies;

  const TMDB_API_KEY = CONFIG.TMDB_API_KEY;
  const apiBase = CONFIG.API_BASE_URL;
  
  useEffect(() => {
    const fetchInitialMovies = async () => {
      try {
        const TMDBurl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        const response = await fetch(TMDBurl);

        if (!response.ok) {
          throw new Error('Failed to fetch movies. Please try again later.');
        }

        const data = await response.json();

        const formattedMovies = data.results.slice(0, 8).map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A',
          poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster',
          director: 'Tap for details', 
          genres: ['Popular']
        }));

        setMovieQueue(formattedMovies);
        
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching movies.');
      } finally {
        setIsFetchingMovies(false);
      }
    };
    
    fetchInitialMovies();
  }, []);

  // --- HANDLERS ---
  const handleNextMovie = (action: () => void) => {
    setIsFading(true);
    setTimeout(() => {
      action();
      setCurrentIndex((prev) => prev + 1);
      setIsFading(false);
      setHoveredStar(null);
      setIsCardShrunk(false); // reset the large poster for next
    }, 300);
  };

  const rateMovie = async (rating: number) => {
    setIsLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem("user");
    
      if (!storedUser) {
        setError('No user data found. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(storedUser);

      const payload = { 
        userId: user._id,
        movieId: currentMovie.id,
        rating: rating,
        CreatedAt: new Date().toISOString()
      }

      const response = await fetch(`${apiBase}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating. Please try again.');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }

    handleNextMovie(() => {
      setRatings((prev) => ({ ...prev, [currentMovie.id]: rating }));
    });
  };

  const skipMovie = () => {
    handleNextMovie(() => {
      setRatings((prev) => ({ ...prev, [currentMovie.id]: 'skipped' }));
    });
  };

  const handleFinish = () => {
    console.log("Final Ratings Data:", ratings);
    navigate('/home');
  };

  // --- LOADING SCREEN PROTECTOR ---
  // FIXED: Prevents the app from crashing while waiting for the TMDB fetch
  if (isFetchingMovies) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center font-sans">
        <div className="animate-pulse text-2xl text-[#E85D22] font-serif italic tracking-wider">
          Fetching your movies...
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col min-h-screen font-sans text-white selection:bg-[#E85D22] selection:text-white">
      <div className="flex flex-col lg:flex-row flex-grow">
        
        {/* Left Column */}
        <div className="w-full lg:w-1/2 bg-[#141414] p-8 md:p-16 flex flex-col justify-between lg:border-r lg:border-[#333] min-h-[50vh] lg:min-h-0">
          
          {/* Header */}
          <div className="flex justify-between w-full mb-24">
            <div className="text-xl font-bold tracking-[0.2em] ml-4 text-gray-500">
              CINEMATCH
            </div>
            <div className="text-sm text-gray-500 font-medium tracking-wide">
              Step <span className="font-bold">3</span> of 3
            </div>
          </div>

          {/* Typography & Instructions */}
          <div className="flex flex-col justify-center ml-4">
            <h1 className="text-6xl md:text-8xl lg:text-[110px] font-serif tracking-tight leading-[0.9] text-white mb-2">
              Tell us your
            </h1>
            <h1 className="text-6xl md:text-8xl lg:text-[110px] italic font-serif tracking-tight leading-[0.9] text-[#E85D22] mb-6">
              favorites
            </h1>
            <p className="text-gray-400 text-lg max-w-sm mb-12">
              Rate each card and save it. Skip anything you haven't seen.
            </p>

            {/* Progress Bar */}
            <div className="max-w-md">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <span>Your ratings</span>
                <span><strong className="text-[#E85D22]">{currentIndex}</strong> of {totalMovies} rated</span>
              </div>
              <div className="w-full bg-black border border-[#333] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#E85D22] h-full transition-all duration-500 ease-out"
                  style={{ width: totalMovies > 0 ? `${(currentIndex / totalMovies) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 p-4 rounded-lg w-max text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Conditional Layout */}
          <div className={`ml-0 lg:ml-4 transition-opacity duration-500 ease-in-out`}>
            
            {isFinished ? (
              // The Finale State
              <div className="animate-fade-in-up">
                <h2 className="text-4xl font-serif italic text-[#E85D22] mb-4">All set!</h2>
                <p className="text-gray-400 mb-8">We've locked in your tastes.</p>
                <button 
                  onClick={handleFinish}
                  className="bg-[#E85D22] hover:bg-[#d04e1b] text-white px-8 py-3.5 rounded-full font-bold transition-colors inline-flex items-center gap-2"
                >
                  See my picks <span>&rarr;</span>
                </button>
              </div>
            ) : (
              // The Normal State (Movie Meta)
              <div className={`${isFading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* FIXED: Optional chaining added to prevent map crashes */}
                  {currentMovie?.genres?.map((genre: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 border-1 border-[#E85D22] bg-[#2A1200] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-2">
                  {currentMovie?.title}
                </h2>
                <p className="text-gray-500">
                  Directed by {currentMovie?.director} • {currentMovie?.year}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* --- Right Column --- */}
        <div className="w-full lg:w-1/2 bg-black p-8 md:p-16 flex flex-col items-center justify-center relative min-h-[50vh] lg:min-h-0">
          
          {/* The Interactive Card */}
          {!isFinished && currentMovie && (
            <div 
              onClick={() => !isCardShrunk && setIsCardShrunk(true)}
              className={`relative flex flex-col items-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCardShrunk 
                  ? 'w-full max-w-md bg-white rounded-[2rem] p-6 cursor-default' 
                  : 'w-full max-w-md xl:max-w-lg bg-transparent rounded-2xl p-0 cursor-pointer hover:scale-[1.02]'
              } ${isFading ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
            >
              
              {/* The Poster Image */}
              <div className={`w-full transition-all duration-700 overflow-hidden ${isCardShrunk ? 'aspect-[2/3] rounded-xl' : 'aspect-[2/3] rounded-2xl shadow-2xl'}`}>
                <img 
                  src={currentMovie.poster} 
                  alt={currentMovie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* The Rating UI */}
              <div className={`flex flex-col items-center w-full transition-all duration-500 ${isCardShrunk ? 'opacity-100 mt-6 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                <h3 className="text-black font-serif text-2xl mb-1 text-center leading-tight">{currentMovie.title}</h3>
                <p className="text-gray-400 text-xs mb-4">{currentMovie.director} • {currentMovie.year}</p>
                
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[2, 4, 6, 8, 10].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={() => rateMovie(star)}
                      disabled={isLoading}
                      className="transition-transform hover:scale-110 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      {(hoveredStar !== null && star <= hoveredStar) ? (
                        <StarSolid className="w-8 h-8 text-[#E85D22]" />
                      ) : (
                        <StarSolid className="w-8 h-8 text-gray-200 hover:text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Rating Label */}
                <p className="text-[#E85D22] text-sm font-semibold mb-4 h-5">
                  {hoveredStar === 2 && 'Poor'}
                  {hoveredStar === 4 && 'Fair'}
                  {hoveredStar === 6 && 'Good'}
                  {hoveredStar === 8 && 'Great'}
                  {hoveredStar === 10 && 'Perfect'}
                </p>

                <button 
                  onClick={skipMovie}
                  disabled={isLoading}
                  className="bg-[#E85D22] text-white text-xs font-bold cursor-pointer uppercase tracking-wider px-6 py-2 rounded-full hover:bg-[#d04e1b] transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateMoviesScreen;
