import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CONFIG from '../config';

const GENRE_MAP: { [key: number]: string } = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

interface MovieResult {
  id: number;
  title: string;
  year: string;
  genres: string[];
  match: number;
  image: string;
  director?: string;
  duration?: string;
  services?: string[];
}

const Search: React.FC = () => {
    // const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All services');
    const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filters = [
        'All services', 'Netflix', 'Hulu', 'Apple TV', '|',
        'Sci-fi', 'Drama', 'Action', 'Horror', 'Comedy', 'Anime', 'Fantasy', '|',
        'Highest Match', 'Recently Added'
    ];

    const apiBase = CONFIG.API_BASE_URL;


    // --- Search Fetching Logic with Debounce ---
    useEffect(() => {
        // If search is empty, clear results and don't fetch
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                
                const API_KEY = CONFIG.TMDB_API_KEY;
                
                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US&page=1`);
                
                if (!response.ok) throw new Error('Failed to fetch from TMDB');
                
                const data = await response.json();

                // Format TMDB data to match your UI requirements
                if (data.results) {
                    const formattedResults: MovieResult[] = data.results.map((movie: any) => ({
                        id: movie.id,
                        title: movie.title,
                        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A', // Extract just the year
                        // Map TMDB genre IDs to text, filter out undefined ones, and take max 3
                        genres: movie.genre_ids ? movie.genre_ids.map((id: number) => GENRE_MAP[id]).filter(Boolean).slice(0, 3) : [],
                        match: movie.vote_average ? Math.round(movie.vote_average * 10) : 0, // Convert 7.5 to 75
                        image: movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                            : 'https://via.placeholder.com/500x750/151515/FFFFFF?text=No+Poster', // Fallback image
                        // These are not provided by the basic TMDB search endpoint:
                        director: 'N/A', 
                        duration: 'N/A', 
                        services: ['Check Provider'] 
                    }));
                    
                    setSearchResults(formattedResults);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 500); // Wait 500ms after user stops typing to fetch

        return () => clearTimeout(delayDebounceFn); // Cleanup on unmount or re-render
    }, [searchQuery]);

    // --- Watchlist Logic ---
    const handleAddWatchlist = async (movieId: number) => {
        setIsLoading(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                setError('User not authenticated. Please log in again.');
                return;
            }
            
            const user = JSON.parse(savedUser);

            const payload = {
                userId: user._id,
                movieId: String(movieId),
                status: 'unwatched',
                addedAt: new Date().toISOString()
            };

            const response = await fetch(`${apiBase}/api/watchlist`, {
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
            console.log('Movie added to watchlist successfully');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E85D22] selection:text-white">
        
        <Navbar />

        <main className="mx-auto px-32 pt-16 pb-24">
            
            {/* Hero Section */}
            <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-serif tracking-tight leading-none mb-2">
                Find your next
            </h1>
            <h1 className="text-6xl md:text-7xl font-serif italic text-[#E85D22] tracking-tight leading-none mb-6">
                film.
            </h1>
            <p className="text-gray-400 text-lg">
                Search across everything available on your services.
            </p>
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
            {/* Loading Indicator */}
            {isLoading && searchQuery && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    Searching...
                </div>
            )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3 mb-12">
            {filters.map((filter, index) => {
                if (filter === '|') {
                return <div key={index} className="w-px h-6 bg-white/20 mx-1"></div>;
                }
                
                const isActive = activeFilter === filter;
                return (
                <button
                    key={index}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                    ${isActive 
                        ? 'border-[#E85D22] text-white bg-[#E85D22]/10' 
                        : 'border-white/20 text-gray-400 hover:border-gray-400 hover:text-white'
                    }`}
                >
                    {filter}
                </button>
                );
            })}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8">
                    {error}
                </div>
            )}

            {/* Results List */}
            <div className="flex flex-col gap-4">
            
            {!isLoading && searchQuery && searchResults.length === 0 && (
                <div className="text-gray-400 text-center py-12">
                    No movies found matching "{searchQuery}"
                </div>
            )}

            {searchResults.map((movie) => (
                <div key={movie.id} className="flex flex-col md:flex-row bg-[#151515] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                
                {/* Movie Poster */}
                <div className="w-full md:w-32 h-48 md:h-auto flex-shrink-0">
                    <img 
                    src={movie.image} 
                    alt={movie.title} 
                    className="w-full h-full object-cover"
                    />
                </div>

                {/* Movie Info */}
                <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                    <h2 className="text-3xl font-serif font-bold mb-2">{movie.title}</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        {movie.year} {movie.director !== 'N/A' && `· ${movie.director}`} {movie.duration !== 'N/A' && `· ${movie.duration}`}
                    </p>
                    <div className="flex gap-2">
                        {movie.genres.map((genre, idx) => (
                        <span key={idx} className="bg-white/5 text-gray-300 text-xs px-3 py-1 rounded-full font-medium">
                            {genre}
                        </span>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="p-6 flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-white/5 md:w-64">
                    <div className="text-left md:text-right w-full mb-4 md:mb-0">
                    {movie.match > 0 ? (
                        <div className="text-4xl font-serif text-[#E85D22] mb-1">{movie.match}%</div>
                    ) : (
                        <div className="text-lg font-serif text-gray-500 mb-1 mt-2">Unrated</div>
                    )}
                    
                    </div>
                    
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-medium hover:bg-white/5 transition-colors w-full md:w-auto justify-center" onClick={() => handleAddWatchlist(movie.id)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add to watchlist
                    </button>
                </div>

                </div>
            ))}
            </div>

        </main>
        </div>
    );
};

export default Search;
