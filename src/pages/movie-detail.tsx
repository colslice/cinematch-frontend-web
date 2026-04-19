import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Grabs movie ID from URL

    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    const userId = storedUser ? JSON.parse(storedUser)._id : null;

    // TMDB Data State
    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // User Interaction State
    const [addedToWatchlist, setAddedToWatchlist] = useState(false);
    const [watchlistDbId, setWatchlistDbId] = useState<string | null>(null); // MongoDB _id for watchlist
    
    const [showRating, setShowRating] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [reviewDbId, setReviewDbId] = useState<string | null>(null); // MongoDB _id for review
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    const ratingLabels: Record<number, string> = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Great',
        5: 'Perfect',
    };

    // FETCH TMDB MOVIE DATA
    useEffect(() => {
        const fetchMovieData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates,watch/providers`
                );

                if (!response.ok) throw new Error('Failed to fetch movie data');
                const data = await response.json();

                const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Unknown';
                const usRelease = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
                const rating = usRelease?.release_dates?.[0]?.certification || 'NR';
                const providers = data['watch/providers']?.results?.US?.flatrate?.map((p: any) => p.provider_name) || [];
                const cast = data.credits?.cast?.slice(0, 3).map((c: any) => {
                    const initials = c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    return { name: c.name, initials };
                }) || [];

                setMovie({
                    title: data.title,
                    director: director,
                    year: data.release_date?.split('-')[0] || 'Unknown',
                    runtime: `${data.runtime} mins`,
                    rating: rating,
                    genres: data.genres?.map((g: any) => g.name) || [],
                    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
                    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
                    description: data.overview,
                    streamingOn: providers,
                    imdbRating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
                    cast: cast,
                    matchScore: 97,
                    matchReason: 'Based on your viewing history, you consistently rate cerebral, emotionally-driven sci-fi at the top. This matches your pattern.',
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMovieData();
    }, [id]);

    // Is it in their watchlist/ratings?
    useEffect(() => {
        if (!userId || !id) return;

        const checkUserDatabaseStatus = async () => {
            try {
                // Check Watchlist
                const wlResponse = await fetch(`/api/watchlist/user/${userId}`);
                if (wlResponse.ok) {
                    const wlData = await wlResponse.json();
                    // Match TMDB id with database movieId
                    const existingWl = wlData.find((item: any) => String(item.movieId) === String(id));
                    if (existingWl) {
                        setAddedToWatchlist(true);
                        setWatchlistDbId(existingWl._id || existingWl.id);
                    }
                }

                // Check Ratings/Reviews
                const revResponse = await fetch(`/api/reviews/user/${userId}`);
                if (revResponse.ok) {
                    const revData = await revResponse.json();
                    const existingRev = revData.find((item: any) => String(item.movieId) === String(id));
                    if (existingRev) {
                        setUserRating(existingRev.rating || existingRev.score || 0);
                        setReviewDbId(existingRev._id || existingRev.id);
                    }
                }
            } catch (err) {
                console.error("Failed to load user status for this movie", err);
            }
        };

        checkUserDatabaseStatus();
    }, [userId, id]);

    // 3. HANDLER: TOGGLE WATCHLIST
    const handleWatchlistToggle = async () => {
        if (!userId) {
            alert("Please log in to manage your watchlist.");
            return;
        }

        try {
            if (addedToWatchlist && watchlistDbId) {
                // Remove from database
                setAddedToWatchlist(false); // Optimistic UI update
                await fetch(`/api/watchlist/${watchlistDbId}`, { method: 'DELETE' });
                setWatchlistDbId(null);
            } else {
                // Add to database
                setAddedToWatchlist(true); // Optimistic UI update
                const response = await fetch(`/api/watchlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, movieId: id, status: 'Plan to Watch' })
                });
                
                const data = await response.json();
                if (data._id || data.id) setWatchlistDbId(data._id || data.id);
            }
        } catch (err) {
            console.error("Failed to toggle watchlist", err);
        }
    };

    // 4. HANDLER: RATE MOVIE
    const handleRateMovie = async (star: number) => {
        if (!userId) {
            alert("Please log in to rate movies.");
            return;
        }

        try {
            setUserRating(star); // Optimistic UI update
            setShowRating(false);

            if (reviewDbId) {
                // Update existing rating in DB
                await fetch(`/api/reviews/${reviewDbId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: star })
                });
            } else {
                // Create new rating in DB
                const response = await fetch(`/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, movieId: id, rating: star })
                });
                
                const data = await response.json();
                if (data._id || data.id) setReviewDbId(data._id || data.id);
            }
        } catch (err) {
            console.error("Failed to rate movie", err);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#2b2b2b] text-white flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen bg-[#2b2b2b] text-white flex items-center justify-center">Error: {error}</div>;
    if (!movie) return null;

    return (
        <div className="min-h-screen bg-[#2b2b2b] text-white font-sans">
            {/* ── Backdrop ── */}
            <div className="relative w-full h-[420px]">
                {movie.backdrop && (
                    <img
                        src={movie.backdrop}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2b2b2b] via-[#2b2b2b]/40 to-transparent" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-5 left-8 text-white text-sm hover:text-gray-300 transition-colors cursor-pointer"
                >
                    ← back
                </button>

                <div className="absolute bottom-16 left-8 flex gap-2">
                    {movie.genres.map((genre: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
                            {genre}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Title + Meta + Buttons ── */}
            <div className="px-8 pb-6">
                <h1 className="text-6xl font-serif text-white mb-2 leading-tight">{movie.title}</h1>
                <p className="text-[#888] text-sm mb-5 tracking-tight">
                    {movie.director} · {movie.year} · {movie.runtime.replace(' mins', 'm')} · {movie.rating}
                </p>

                <div className="flex flex-wrap items-end gap-6 mb-10">
                    <div className="flex gap-3">
                        <button
                            onClick={handleWatchlistToggle} // <-- Hooked up to backend
                            className={`px-5 py-2.5 rounded-[10px] text-sm font-bold transition-colors cursor-pointer ${
                                addedToWatchlist ? 'bg-white text-black' : 'bg-[#E85D22] hover:bg-[#d0521e] text-white'
                            }`}
                        >
                            {addedToWatchlist ? '✓ Added to watchlist' : '+ Add to watchlist'}
                        </button>
                        
                        {userRating > 0 ? (
                            <button
                                onClick={() => setShowRating(!showRating)}
                                className="px-5 py-2.5 rounded-[10px] text-sm font-bold border-2 border-[#E85D22] text-[#E85D22] transition-colors cursor-pointer"
                            >
                                ★ Rated {userRating}/5
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowRating(!showRating)}
                                className="px-5 py-2.5 rounded-[10px] text-sm font-bold border-2 border-white/20 hover:border-white/40 text-white transition-colors cursor-pointer"
                            >
                                ★ Rate this movie
                            </button>
                        )}
                    </div>

                    {/* Available On */}
                    {movie.streamingOn.length > 0 && (
                        <div>
                            <p className="text-[#888] text-[10px] font-semibold tracking-widest uppercase mb-2">Available On</p>
                            <div className="flex items-center gap-5">
                                {movie.streamingOn.map((provider: string, idx: number) => (
                                    <span key={idx} className="font-bold text-sm tracking-tight text-white/80">
                                        {provider}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Rating Bar ── */}
                {showRating && (
                    <div className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl px-6 py-4 mb-8 w-full max-w-2xl">
                        <span className="text-gray-400 text-sm font-semibold">Your rating</span>
                        <div className="flex gap-2 ml-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(null)}
                                    onClick={() => handleRateMovie(star)} // <-- Hooked up to backend
                                    className="cursor-pointer transition-transform hover:scale-110"
                                >
                                    <StarIcon
                                        className={`w-8 h-8 transition-colors ${
                                            star <= (hoveredStar ?? userRating) ? 'text-[#E85D22]' : 'text-gray-600'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {(hoveredStar || userRating) ? (
                            <span className="text-[#E85D22] text-sm font-semibold">
                                {ratingLabels[hoveredStar ?? userRating]}
                            </span>
                        ) : null}
                    </div>
                )}

                {/* Lower Section */}
                <div className="flex gap-10">
                    {/* Left Column */}
                    <div className="flex-1">
                        <div className="flex gap-6 mb-6">
                            {movie.poster ? (
                                <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    className="w-[165px] h-[230px] object-cover rounded-lg flex-shrink-0"
                                />
                            ) : (
                                <div className="w-[165px] h-[230px] bg-[#1a1a1a] rounded-lg flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[#444] text-xs">No Poster</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                                    {movie.description}
                                </p>

                                <div className="flex gap-3">
                                    <div className="flex-1 border border-[#444] rounded-lg px-4 py-3">
                                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">Director</p>
                                        <p className="text-white text-sm font-semibold">{movie.director}</p>
                                    </div>
                                    <div className="flex-1 border border-[#444] rounded-lg px-4 py-3">
                                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">Runtime</p>
                                        <p className="text-white text-sm font-semibold">{movie.runtime}</p>
                                    </div>
                                    <div className="flex-1 border border-[#444] rounded-lg px-4 py-3">
                                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">Year</p>
                                        <p className="text-white text-sm font-semibold">{movie.year}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Match Score Box (Mocked) */}
                        <div className="border border-[#E85D22]/40 rounded-lg px-5 py-4">
                            <p className="text-[#E85D22] text-xs font-bold tracking-widest uppercase mb-2">
                                {movie.matchScore}% Match For You
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {movie.matchReason}
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-64 flex-shrink-0">
                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-3">Rating</p>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-white text-5xl font-bold">{movie.imdbRating}</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon key={star} className="w-6 h-6 text-[#E85D22]" />
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-[#444] mb-6" />

                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-4">Director</p>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#444] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                    {movie.director !== 'Unknown' ? movie.director.split(' ').map((n: string) => n[0]).join('').substring(0,2) : '?'}
                                </span>
                            </div>
                            <span className="text-white text-sm font-semibold">{movie.director}</span>
                        </div>

                        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-4">Cast</p>
                        <div className="flex flex-col gap-4">
                            {movie.cast.map((member: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#444] flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">{member.initials}</span>
                                    </div>
                                    <span className="text-white text-sm font-semibold">{member.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetail;