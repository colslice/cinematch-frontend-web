import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import CONFIG from '../../config';

const RateMoviesScreen: React.FC = () => {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [movieQueue, setMovieQueue] = useState<any[]>([]);
  const [isFetchingMovies, setIsFetchingMovies] = useState(true);

  const currentMovie = movieQueue[currentIndex];
  const totalMovies = movieQueue.length;
  const ratedCount = Object.keys(ratings).length;

  const IDEAL_RATINGS = 8;
  const MOVIES_BEFORE_EARLY_EXIT = 10;
  const canFinishEarly = currentIndex >= MOVIES_BEFORE_EARLY_EXIT;
  const hasIdealRatings = ratedCount >= IDEAL_RATINGS;
  const canFinish = hasIdealRatings || canFinishEarly;

  const isFinished = totalMovies > 0 && currentIndex >= totalMovies;

  const TMDB_API_KEY = CONFIG.TMDB_API_KEY;
  const apiBase = CONFIG.API_BASE_URL;

  useEffect(() => {
    const fetchInitialMovies = async () => {
      try {
        const genreNameToId: Record<string, number> = {
          'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
          'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
          'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
          'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
          'War': 10752, 'Western': 37
        };

        const genreIdToName: Record<number, string> = Object.fromEntries(
          Object.entries(genreNameToId).map(([name, id]) => [id, name])
        );

        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const favGenres: string[] = user?.FavGenre ?? [];

        const genreIds = favGenres
          .map((name: string) => genreNameToId[name])
          .filter(Boolean);

        const withGenres = genreIds.length > 0 ? genreIds.join('|') : '';

        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          language: 'en-US',
          page: '1',
          include_adult: 'false',
          include_video: 'false',
          'vote_count.gte': '500',
          ...(withGenres && { with_genres: withGenres })
        });

        const response = await fetch(`https://api.themoviedb.org/3/discover/movie?${params}`);

        if (!response.ok) throw new Error('Failed to fetch movies. Please try again later.');

        const data = await response.json();
        const movies = data.results.slice(0, 20);

        const creditsResults = await Promise.all(
          movies.map((movie: any) =>
            fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`)
              .then(res => res.json())
              .catch(() => null)
          )
        );

        const formattedMovies = movies.map((movie: any, idx: number) => {
          const credits = creditsResults[idx];
          const director = credits?.crew?.find(
            (member: any) => member.job === 'Director'
          )?.name ?? 'Unknown';

          const genres = (movie.genre_ids as number[])
            .slice(0, 3)
            .map(id => genreIdToName[id])
            .filter(Boolean);

          return {
            id: movie.id,
            title: movie.title,
            year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A',
            poster: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : 'https://via.placeholder.com/500x750?text=No+Poster',
            director,
            genres: genres.length > 0 ? genres : ['Popular']
          };
        });

        setMovieQueue(formattedMovies);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching movies.');
      } finally {
        setIsFetchingMovies(false);
      }
    };

    fetchInitialMovies();
  }, []);

  const handleNextMovie = (action: () => void) => {
    setIsFading(true);
    setTimeout(() => {
      action();
      setCurrentIndex((prev) => prev + 1);
      setIsFading(false);
      setHoveredStar(null);
    }, 300);
  };

  const rateMovie = async (rating: number) => {
    setIsLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setError('No user data found. Please sign in again.');
        return;
      }

      const user = JSON.parse(storedUser);

      const payload = {
        userId: user._id,
        movieId: currentMovie.id,
        rating: rating,
        CreatedAt: new Date().toISOString()
      };

      const response = await fetch(`${apiBase}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit rating. Please try again.');

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
    handleNextMovie(() => {});
  };

  const handleFinish = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        await fetch(`${apiBase}/api/users/${user._id}/toggle/NewUser`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        user.NewUser = false;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (err) {
      console.error('Failed to update NewUser flag:', err);
    }
    navigate('/home');
  };


  // --- LOADING SCREEN PROTECTOR ---
  if (isFetchingMovies) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center font-sans">
        <div className="animate-pulse text-2xl text-[#E85D22] font-serif italic tracking-wider">
          Fetching your movies...
        </div>
      </div>
    );
  }

  // --- QUEUE EXHAUSTED STATE ---
  if (isFinished) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center font-sans">
        <div className="text-center max-w-md px-8">
          <h2 className="text-5xl font-serif italic text-[#E85D22] mb-4">All set!</h2>
          <p className="text-gray-400 mb-2">
            {hasIdealRatings
              ? "We've locked in your tastes."
              : `You rated ${ratedCount} movie${ratedCount !== 1 ? 's' : ''} — we'll use what we have to get you started.`}
          </p>
          <p className="text-gray-600 text-sm mb-8">You can always rate more from the home screen.</p>
          <button
            onClick={handleFinish}
            className="bg-[#E85D22] hover:bg-[#d04e1b] text-white px-8 py-3.5 rounded-full font-bold transition-colors inline-flex items-center gap-2"
          >
            See my picks <span>&rarr;</span>
          </button>
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

            <div className="max-w-md">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <span>Your ratings</span>
                <span>
                  <strong className="text-[#E85D22]">{ratedCount}</strong> of {IDEAL_RATINGS} rated
                </span>
              </div>
              <div className="w-full bg-black border border-[#333] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#E85D22] h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((ratedCount / IDEAL_RATINGS) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 p-4 rounded-lg w-max text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Movie Meta */}
          <div className="ml-0 lg:ml-4 transition-opacity duration-500 ease-in-out">
            <div className={`${isFading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
              <div className="flex flex-wrap gap-2 mb-4">
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
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className="w-full lg:w-1/2 bg-black p-8 md:p-16 flex flex-col items-center justify-center gap-6 relative min-h-[50vh] lg:min-h-0">

          {/* Movie Card */}
          {currentMovie && (
            <div className={`relative flex flex-col items-center overflow-hidden w-full max-w-md bg-white rounded-[2rem] p-6
              ${isFading ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}
              transition-all duration-300`}
            >
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden mb-6">
                <img
                  src={currentMovie.poster}
                  alt={currentMovie.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-black font-serif text-2xl mb-1 text-center leading-tight">{currentMovie.title}</h3>
              <p className="text-gray-400 text-xs mb-4">{currentMovie.director} • {currentMovie.year}</p>

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
          )}

          {/* Early finish option — shown after 10 movies seen or 8 rated */}
          {canFinish && (
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-3">
                {hasIdealRatings
                  ? "You've rated enough to get great recommendations!"
                  : "You can finish now, or keep rating for better recommendations."}
              </p>
              <button
                onClick={handleFinish}
                className="bg-[#E85D22] hover:bg-[#d04e1b] text-white px-8 py-3.5 rounded-full font-bold transition-colors inline-flex items-center gap-2"
              >
                See my picks <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateMoviesScreen;
