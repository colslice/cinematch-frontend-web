import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'; // Added for the rating UI

// TMDB uses IDs for genres mapping
const GENRE_MAP: { [key: number]: string } = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

// Updated Interface to include overview, TMDB rating, and vote count
interface MovieResult {
  id: number;
  title: string;
  year: string;
  genres: string[];
  tmdbRating: string;
  voteCount: number;
  image: string;
  overview: string;
  originalLanguage: string;
}

const Search: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return;

        const fetchUserWatchlist = async () => {
            try {
                const user = JSON.parse(savedUser);
                // Utilizing Vite Proxy
                const response = await fetch(`/api/watchlist/user/${user._id}`);
                
                if (response.ok) {
                    const data = await response.json();
                    // Store all saved movie IDs in a Set for super fast lookups
                    const ids = new Set<number>(data.map((item: any) => Number(item.movieId)));
                    setWatchlistIds(ids);
                }
            } catch (err) {
                console.error("Failed to load initial watchlist", err);
            }
        };

        fetchUserWatchlist();
    }, []);

    // --- Search Fetching Logic with Debounce ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US&page=1`);
                
                if (!response.ok) throw new Error('Failed to fetch from TMDB');
                
                const data = await response.json();

                if (data.results) {
                    const formattedResults: MovieResult[] = data.results.map((movie: any) => ({
                        id: movie.id,
                        title: movie.title,
                        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
                        genres: movie.genre_ids ? movie.genre_ids.map((id: number) => GENRE_MAP[id]).filter(Boolean).slice(0, 3) : [],
                        // Grab the exact TMDB rating and vote count
                        tmdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : '0.0',
                        voteCount: movie.vote_count || 0,
                        // Grab the synopsis overview
                        overview: movie.overview || 'No synopsis available for this title.',
                        originalLanguage: movie.original_language || 'en',
                        image: movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                            : 'https://via.placeholder.com/500x750/151515/FFFFFF?text=No+Poster'
                    }));
                    
                    setSearchResults(formattedResults);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // --- Watchlist Logic ---
    const handleAddWatchlist = async (movieId: number) => {
        setError('');

        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            setError('User not authenticated. Please log in again.');
            return;
        }
        
        setWatchlistIds(prev => new Set(prev).add(movieId));

        try {
            const user = JSON.parse(savedUser);
            const payload = {
                userId: user._id,
                movieId: String(movieId),
                status: 'unwatched',
                addedAt: new Date().toISOString()
            };

            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add to watchlist');
            }
        } catch (err: any) {
            setWatchlistIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
            setError(err.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E85D22] selection:text-white">
            <Navbar />

            <div className={`transition-opacity duration-1000 ease-in-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
            <main className="mx-auto px-5 md:px-8 lg:px-32 pt-8 md:pt-16 pb-24 max-w-10xl">
                {/* Hero Section */}
                <div className="mb-8 md:mb-12">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-none mb-2">Find your next</h1>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif italic text-[#E85D22] tracking-tight leading-none mb-4 md:mb-6">film.</h1>
                    <p className="text-gray-400 text-base md:text-lg">Search across everything available on your services.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search movies by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border border-white/20 rounded-full py-4 pl-14 pr-6 text-white placeholder-gray-500 focus:outline-none focus:border-[#E85D22] transition-colors"
                    />
                    {isLoading && searchQuery && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-400">Searching...</div>
                    )}
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8">{error}</div>}

                {/* Results List */}
                <div className="flex flex-col gap-5">
                    {!isLoading && searchQuery && searchResults.length === 0 && (
                        <div className="text-gray-400 text-center py-12">No movies found matching "{searchQuery}"</div>
                    )}

                    {searchResults.map((movie) => {
                        const isAdded = watchlistIds.has(movie.id);

                        return (
                            <div 
                                key={movie.id} 
                                onClick={() => navigate(`/movie/${movie.id}`)}
                                className="flex flex-col md:flex-row bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                            >
                                {/* Movie Poster */}
                                <div className="w-full md:w-40 lg:w-48 h-64 md:h-auto flex-shrink-0 overflow-hidden bg-black">
                                    <img 
                                        src={movie.image} 
                                        alt={movie.title} 
                                        loading="lazy" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    />
                                </div>

                                {/* Movie Info */}
                                <div className="p-5 md:p-6 flex flex-col justify-between flex-grow">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-1 group-hover:text-[#E85D22] transition-colors line-clamp-1">{movie.title}</h2>
                                        
                                        <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4 uppercase tracking-wider font-bold">
                                            {movie.year} <span className="mx-2 opacity-50">|</span> {movie.originalLanguage}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {movie.genres.map((genre, idx) => (
                                                <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 text-[10px] md:text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>

                                        {/* NEW: Movie Synopsis */}
                                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 max-w-3xl">
                                            {movie.overview}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side Actions */}
                                <div 
                                    className="p-5 md:p-6 flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-white/5 md:w-64 flex-shrink-0 bg-[#0a0a0a]/50"
                                    onClick={(e) => e.stopPropagation()} 
                                >
                                    {/* NEW: TMDB Rating Display */}
                                    <div className="text-left md:text-right w-full mb-6 md:mb-0">
                                        {movie.tmdbRating !== '0.0' ? (
                                            <>
                                                <div className="flex items-center md:justify-end gap-1.5 mb-1">
                                                    <StarSolid className="w-6 h-6 md:w-7 md:h-7 text-[#E85D22]" />
                                                    <span className="text-3xl md:text-4xl font-serif text-white">{movie.tmdbRating}</span>
                                                    <span className="text-lg md:text-xl text-gray-500 font-serif">/10</span>
                                                </div>
                                                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">
                                                    TMDB Rating <span className="opacity-50">({movie.voteCount.toLocaleString()} votes)</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-lg font-serif text-gray-500 mb-1 mt-2">Unrated</div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            if (!isAdded) handleAddWatchlist(movie.id);
                                        }}
                                        disabled={isAdded}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all w-full md:w-auto justify-center ${
                                            isAdded 
                                                ? 'bg-white text-black border-white cursor-default' 
                                                : 'border-white/20 text-white hover:bg-[#E85D22] hover:border-[#E85D22] hover:text-white'
                                        }`} 
                                    >
                                        {isAdded ? (
                                            <>✓ Added to watchlist</>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add to watchlist
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
            </div>
        </div>
    );
};

export default Search;
