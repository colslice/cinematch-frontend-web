import React, { useState, useEffect } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar'; // Adjust path if needed

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY; // Ensure this is set in your .env file

interface RatedMovie {
    dbId: string;    // MongoDB _id
    movieId: string; // TMDB ID
    title: string;
    year: string;
    poster: string;
    genres: string;  // Updated to hold the full comma-separated list
    userRating: number;
    tmdbRating: number; // Added for the TMDB score
    ratedAt: string;
}

const RATING_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Perfect',
};

// --- RATING LIST ITEM COMPONENT ---
const RatingListItem: React.FC<{ 
    movie: RatedMovie; 
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ movie, isMenuOpen, onToggleMenu, onEdit, onDelete }) => {
    return (
        <div className="flex items-start gap-5 w-full relative group">
            {/* Poster */}
            <div className="w-[60px] h-[150px] lg:w-[120px] lg:h-[180px] flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px]">No Poster</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
                <h3 className="text-white font-bold text-lg leading-tight mb-1.5">{movie.title}</h3>
                
                <p className="text-gray-400 text-xs mb-2.5">
                    {movie.year} • {movie.genres}
                </p>
                
                <div className="flex items-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                        <StarSolid 
                            key={star} 
                            className={`w-5 h-5 ${star <= movie.userRating ? 'text-[#E85D22]' : 'text-gray-600'}`} 
                        />
                    ))}
                </div>
                
                <p className="text-gray-500 text-xs font-semibold">
                    TMDB: {movie.tmdbRating.toFixed(3)}
                </p>
            </div>

            {/* 3-Dot Menu Button */}
            <button 
                onClick={onToggleMenu} 
                className="p-2 text-gray-500 hover:text-white transition-colors"
            >
                <EllipsisVerticalIcon className="w-6 h-6" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div className="absolute right-8 top-10 bg-[#222222] rounded-xl shadow-2xl py-2 w-40 z-20 border border-white/5">
                    <button 
                        onClick={onEdit} 
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        Edit Rating
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

// --- MAIN PAGE ---
const RatingsPage: React.FC = () => {
    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    const userId = storedUser ? JSON.parse(storedUser)._id : null;

    const [movies, setMovies] = useState<RatedMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Active States
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [selectedMovie, setSelectedMovie] = useState<RatedMovie | null>(null);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [activeSort, setActiveSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchRatings = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // 1. Fetch ratings utilizing your Vite Proxy
                const dbResponse = await fetch(`/api/reviews/user/${userId}`);
                if (!dbResponse.ok) throw new Error('Failed to fetch ratings from database');
                
                const dbData = await dbResponse.json(); 
                if (!Array.isArray(dbData)) throw new Error("Invalid database response");

                // 2. Hydrate with TMDB Data
                const hydratedPromises = dbData.map(async (item: any) => {
                    try {
                        const tmdbResponse = await fetch(
                            `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${TMDB_API_KEY}`
                        );
                        if (!tmdbResponse.ok) return null;
                        
                        const tmdbData = await tmdbResponse.json();

                        return {
                            dbId: item._id,
                            movieId: item.movieId,
                            title: tmdbData.title,
                            year: tmdbData.release_date ? tmdbData.release_date.split('-')[0] : 'N/A',
                            poster: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
                            genres: tmdbData.genres?.map((g: any) => g.name).join(', ') || 'Cinema',
                            userRating: item.rating || item.score || 0,
                            tmdbRating: tmdbData.vote_average || 0,
                            ratedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
                        } as RatedMovie;

                    } catch (err) {
                        return null;
                    }
                });

                const resolvedMovies = (await Promise.all(hydratedPromises)).filter((m): m is RatedMovie => m !== null);
                setMovies(resolvedMovies);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, [userId]);

    // Sorting Logic
    const sortedMovies = [...movies].sort((a, b) => {
        if (activeSort === 'highest') return b.userRating - a.userRating;
        if (activeSort === 'lowest') return a.userRating - b.userRating;
        return new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime();
    });

    // Handle Updating a Rating
    const handleUpdateRating = async (newRating: number) => {
        if (!selectedMovie) return;
        setIsUpdating(true);

        try {
            setMovies(prev => prev.map(m => m.dbId === selectedMovie.dbId ? { ...m, userRating: newRating } : m));
            setSelectedMovie(null);

            // Utilizing Vite Proxy
            await fetch(`/api/reviews/${selectedMovie.dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: newRating })
            });
        } catch (err) {
            console.error("Failed to update rating", err);
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle Removing a Rating
    const handleDeleteRating = async (dbId: string) => {
        setIsUpdating(true);
        setActiveDropdownId(null);

        try {
            setMovies(prev => prev.filter(m => m.dbId !== dbId));
            if (selectedMovie?.dbId === dbId) setSelectedMovie(null);

            // Utilizing Vite Proxy
            await fetch(`/api/reviews/${dbId}`, {
                method: 'DELETE',
            });
        } catch (err) {
            console.error("Failed to delete rating", err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center font-sans">Loading Ratings...</div>;
    
    if (error) return (
        <div className="min-h-screen bg-[#0d0d0d] text-red-500 flex flex-col items-center justify-center font-sans p-10 text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400">{error}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-sans relative">
            <Navbar />

            {/* Invisible overlay to close dropdowns when clicking outside */}
            {activeDropdownId && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setActiveDropdownId(null)} 
                />
            )}

            {/* Adjusted padding to match the mobile/centered layout vibe */}
            <main className="px-8 md:px-40 pt-10 pb-16">
                <p className="text-[#E85D22] text-sm font-bold tracking-widest uppercase mb-1">
                    Your Film Diary
                </p>
                <div className="flex items-end gap-6 mb-8">
                    <h1 className="text-4xl md:text-6xl font-serif text-white leading-none">Your Ratings</h1>
                    <span className="text-gray-500 font-bold mb-1">{movies.length} Films</span>
                </div>

                <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    {(
                        [
                            { key: 'recent', label: 'Recently Rated' },
                            { key: 'highest', label: 'Highest Rated' },
                            { key: 'lowest', label: 'Lowest Rated' },
                        ] as const
                    ).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSort(key)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                                activeSort === key
                                    ? 'bg-[#E85D22] text-white'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-8">
                    {sortedMovies.length > 0 ? (
                        sortedMovies.map(movie => (
                            <RatingListItem
                                key={movie.dbId}
                                movie={movie}
                                isMenuOpen={activeDropdownId === movie.dbId}
                                onToggleMenu={() => setActiveDropdownId(activeDropdownId === movie.dbId ? null : movie.dbId)}
                                onEdit={() => {
                                    setActiveDropdownId(null);
                                    setSelectedMovie(movie);
                                }}
                                onDelete={() => handleDeleteRating(movie.dbId)}
                            />
                        ))
                    ) : (
                        <div className="w-full text-center py-20">
                            <p className="text-gray-400 text-lg">You haven't rated any movies yet.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Rating Modal (Preserved from original functionality) */}
            {selectedMovie && (
                <div
                    className="fixed inset-0 bg-black/[0.92] flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedMovie(null)}
                >
                    <div className="flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        
                        <div className="w-full flex justify-end mb-3">
                            <button
                                onClick={() => setSelectedMovie(null)}
                                className="text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                                <XMarkIcon className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="relative bg-white rounded-t-2xl w-64 shadow-2xl p-4 flex flex-col items-center">
                           <h2 className="text-black font-black text-center uppercase tracking-tight text-xl mb-1 mt-2">{selectedMovie.title}</h2>
                           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Current Rating: {selectedMovie.userRating}/5</p>
                        </div>

                        <div className="relative w-64 h-0 overflow-visible z-10">
                            <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#111] -translate-y-1/2" />
                            <div className="absolute left-3 right-3 top-0 border-t-2 border-dashed border-gray-300" />
                            <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#111] -translate-y-1/2" />
                        </div>

                        <div className="bg-[#2a2a2a] rounded-b-2xl px-6 py-6 w-64 shadow-2xl">
                            <p className="text-white text-sm font-black tracking-widest uppercase mb-4 text-center">
                                Change Rating
                            </p>

                            <div className="flex gap-1.5 justify-center mb-2">
                                {[1, 2, 3, 4, 5].map(star => {
                                    const isActive = star <= (hoveredStar ?? selectedMovie.userRating);
                                    return (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(null)}
                                            onClick={() => handleUpdateRating(star)}
                                            disabled={isUpdating}
                                            className="cursor-pointer transition-transform hover:scale-110 disabled:opacity-50"
                                        >
                                            <StarSolid
                                                className={`w-9 h-9 transition-colors ${
                                                    isActive ? 'text-[#E85D22]' : 'text-[#444]'
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-center text-[#E85D22] text-sm font-bold h-5 mb-6">
                                {hoveredStar ? RATING_LABELS[hoveredStar] : RATING_LABELS[selectedMovie.userRating]}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatingsPage;