import React, { useState, useMemo, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

// You will need your TMDB key here since the frontend has to hydrate the movie details
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

interface Stub {
    dbId: string;   // The MongoDB _id (used for deleting the record)
    movieId: string; // The TMDB ID
    title: string;
    year: string;
    poster: string;
    match: number;
    genre: string;
    service: string;
    added: string;
    status: string;
}

const getBarcodePattern = (idStr: string): number[] => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bars: number[] = [];
    let seed = Math.abs((hash + 7) * 1664525);
    for (let i = 0; i < 42; i++) {
        seed = (seed * 22695477 + 1) & 0x7fffffff;
        bars.push(seed % 7 < 1 ? 3 : seed % 7 < 3 ? 2 : 1);
    }
    return bars;
};

const RATING_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Perfect',
};

const Barcode: React.FC<{ id: string }> = ({ id }) => {
    const bars = useMemo(() => getBarcodePattern(id), [id]);
    return (
        <div className="flex items-stretch justify-center gap-[1.5px] h-10 px-6">
            {bars.map((width, i) => (
                <div key={i} className="bg-black shrink-0" style={{ width: `${width}px` }} />
            ))}
        </div>
    );
};

const InfoCell: React.FC<{ label: string; value: string; orange?: boolean; large?: boolean }> =
    ({ label, value, orange, large }) => (
    <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className={`font-bold ${large ? 'text-xl leading-none' : 'text-sm'} ${orange ? 'text-[#E85D22]' : 'text-black'}`}>
            {value}
        </p>
    </div>
);

interface StubCardProps {
    stub: Stub;
    onClick: () => void;
}

const StubCard: React.FC<StubCardProps> = ({ stub, onClick }) => (
    <div
        onClick={onClick}
        className="relative bg-white rounded-2xl shadow-md transition-all duration-300 select-none flex flex-col h-[412px] cursor-pointer hover:-translate-y-2 hover:shadow-2xl"
    >
        <div className="flex-1 overflow-hidden rounded-t-2xl bg-gray-200">
            {stub.poster ? (
                <img src={stub.poster} alt={stub.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Poster</div>
            )}
        </div>

        <div className="grid grid-cols-2">
            <div className="px-4 pt-3 pb-3 border-r border-b border-gray-100">
                <InfoCell label="Match" value={`${stub.match}%`} orange large />
            </div>
            <div className="px-4 pt-3 pb-3 border-b border-gray-100">
                <InfoCell label="Genre" value={stub.genre} />
            </div>
            <div className="px-4 pt-3 pb-3 border-r border-gray-100">
                <InfoCell label="Service" value={stub.service} />
            </div>
            <div className="px-4 pt-3 pb-3">
                <InfoCell label="Added" value={stub.added} />
            </div>
        </div>

        <div className="relative flex items-center my-1">
            <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#0d0d0d] z-10" />
            <div className="w-full border-t-2 border-dashed border-gray-200 mx-3" />
            <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#0d0d0d] z-10" />
        </div>

        <div className="pt-2 pb-3">
            <Barcode id={stub.dbId} />
            <p className="text-center text-[7px] text-gray-300 tracking-widest mt-1">
                {stub.movieId.padStart(6, '0')}-CINEMATCH
            </p>
        </div>
    </div>
);


const WatchlistPage: React.FC = () => {
    // --- LOCAL STORAGE LOGIC ADDED HERE ---
    const storedUser = localStorage.getItem('user');
    const userId = storedUser ? JSON.parse(storedUser)._id : null;

    console.log('--- WatchlistPage Render Triggered --- | userId from storage:', userId);

    const [stubs, setStubs] = useState<Stub[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedStub, setSelectedStub] = useState<Stub | null>(null);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [activeSort, setActiveSort] = useState<'recent' | 'match' | 'az'>('recent');
    const [isTearing, setIsTearing] = useState(false);
    const [removedStubs, setRemovedStubs] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) {
            console.log('[0] No userId available yet. Halting fetch.');
            setLoading(false);
            return;
        }

        const fetchWatchlist = async () => {
            try {
                console.log(`[1] Starting DB fetch for user: ${userId}`);
                setLoading(true);
                setError(null);
                
                // 1. Fetch from Express
                const dbResponse = await fetch(`http://localhost:8080/api/watchlist/user/${userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                console.log(`[2] DB Response Status:`, dbResponse.status);

                if (!dbResponse.ok) throw new Error(`DB Fetch failed with status ${dbResponse.status}`);
                
                const dbData = await dbResponse.json(); 
                console.log(`[3] DB Data Parsed:`, dbData);

                // Safety Check: Make sure it's an array before mapping
                if (!Array.isArray(dbData)) {
                    throw new Error("Expected database to return an array, but got: " + typeof dbData);
                }

                if (dbData.length === 0) {
                    console.log('[3b] User has no movies in their watchlist.');
                    setStubs([]);
                    return; // exit early if no movies
                }

                // 2. Fetch from TMDB
                const hydratedStubsPromises = dbData.map(async (item: any) => {
                    try {
                        console.log(`[4a] Fetching TMDB for movieId: ${item.movieId}`);
                        const tmdbResponse = await fetch(
                            `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${TMDB_API_KEY}`
                        );
                        
                        if (!tmdbResponse.ok) {
                            console.warn(`[WARNING] TMDB failed for movieId ${item.movieId}`);
                            return null; 
                        }
                        
                        const tmdbData = await tmdbResponse.json();
                        console.log(`[4b] TMDB Success for ${item.movieId}:`, tmdbData.title);

                        return {
                            dbId: item._id, 
                            movieId: item.movieId,
                            title: tmdbData.title,
                            year: tmdbData.release_date ? tmdbData.release_date.split('-')[0] : 'N/A',
                            poster: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
                            match: Math.floor(Math.random() * 20) + 80, 
                            genre: tmdbData.genres?.[0]?.name || 'Cinema',
                            service: 'VOD', 
                            added: item.addedAt ? new Date(item.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
                            status: item.status
                        } as Stub;

                    } catch (err) {
                        console.error(`[ERROR] Caught error fetching TMDB data for ${item.movieId}:`, err);
                        return null;
                    }
                });

                const resolvedStubs = (await Promise.all(hydratedStubsPromises)).filter((stub): stub is Stub => stub !== null);
                
                console.log(`[5] All promises resolved. Final Hydrated Stubs:`, resolvedStubs);
                setStubs(resolvedStubs);

            } catch (err: any) {
                console.error(`[FATAL ERROR] Fetch Process Failed:`, err);
                setError(err.message);
            } finally {
                console.log(`[6] Fetch process finished. Setting loading to false.`);
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, [userId]);

    const sortedStubs = [...stubs]
        .filter(s => !removedStubs.has(s.dbId))
        .sort((a, b) => {
            if (activeSort === 'match') return b.match - a.match;
            if (activeSort === 'az') return a.title.localeCompare(b.title);
            return new Date(b.added).getTime() - new Date(a.added).getTime(); 
        });

    const tearAndClose = async (dbId: string) => {
        setIsTearing(true);
        console.log(`[DELETE] Starting removal for dbId: ${dbId}`);
        
        setTimeout(() => {
            setRemovedStubs(prev => new Set([...prev, dbId]));
            setSelectedStub(null);
            setHoveredStar(null);
            setIsTearing(false);
        }, 700);

        try {
            const deleteRes = await fetch(`http://localhost:8080/api/watchlist/${dbId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            console.log(`[DELETE] Response Status:`, deleteRes.status);
        } catch (err) {
            console.error("[DELETE ERROR] Failed to remove from database:", err);
        }
    };

    const closeModal = () => {
        if (isTearing) return;
        setSelectedStub(null);
        setHoveredStar(null);
    };

    if (loading) return <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center font-sans">Loading Watchlist...</div>;
    
    if (error) return (
        <div className="min-h-screen bg-[#0d0d0d] text-red-500 flex flex-col items-center justify-center font-sans p-10 text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400">{error}</p>
            <p className="text-gray-500 text-sm mt-4">Check your browser console for detailed logs.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
            <Navbar />

            <main className="px-8 md:px-40 pt-10 pb-16">
                <p className="text-[#E85D22] text-sm font-bold tracking-widest uppercase mb-1">
                    Saved to Watch
                </p>
                <h1 className="text-6xl font-serif text-white mb-8">Your Watchlist</h1>

                <div className="flex gap-3 mb-8">
                    {(
                        [
                            { key: 'recent', label: 'Recently Added' },
                            { key: 'match', label: 'Best Match' },
                            { key: 'az', label: 'A–Z' },
                        ] as const
                    ).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSort(key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                                activeSort === key
                                    ? 'bg-[#E85D22] text-white'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-10">
                    {sortedStubs.length > 0 ? (
                        sortedStubs.map(stub => (
                            <div key={stub.dbId} className="w-[302px]">
                                <StubCard
                                    stub={stub}
                                    onClick={() => setSelectedStub(stub)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Your watchlist is empty.</p>
                    )}
                </div>
            </main>

            {/* Modal Overlay */}
            {selectedStub && (
                <div
                    className="fixed inset-0 bg-black/[0.92] flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                >
                    <div className="flex flex-col items-center" onClick={e => e.stopPropagation()}>

                        <div className="w-full flex justify-end mb-3">
                            <button
                                onClick={closeModal}
                                className="text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                                <XMarkIcon className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="relative bg-white rounded-t-2xl w-64 shadow-2xl">
                            <div className="w-full aspect-[3/4] overflow-hidden rounded-t-2xl">
                                {selectedStub.poster ? (
                                    <img
                                        src={selectedStub.poster}
                                        alt={selectedStub.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Poster</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2">
                                <div className="px-4 pt-3 pb-3 border-r border-b border-gray-100">
                                    <InfoCell label="Match" value={`${selectedStub.match}%`} orange large />
                                </div>
                                <div className="px-4 pt-3 pb-3 border-b border-gray-100">
                                    <InfoCell label="Genre" value={selectedStub.genre} />
                                </div>
                                <div className="px-4 pt-3 pb-3 border-r border-gray-100">
                                    <InfoCell label="Service" value={selectedStub.service} />
                                </div>
                                <div className="px-4 pt-3 pb-3">
                                    <InfoCell label="Added" value={selectedStub.added} />
                                </div>
                            </div>
                            <div className="pb-3" />
                        </div>

                        <div className="relative w-64 h-0 overflow-visible z-10">
                            <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#111] -translate-y-1/2" />
                            <div className="absolute left-3 right-3 top-0 border-t-2 border-dashed border-gray-300" />
                            <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#111] -translate-y-1/2" />
                        </div>

                        <div
                            className={`bg-white rounded-b-2xl w-64 pt-2 pb-3 shadow-2xl transition-all duration-700 ease-in-out ${
                                isTearing ? 'translate-y-14 opacity-0' : 'translate-y-0 opacity-100'
                            }`}
                        >
                            <Barcode id={selectedStub.dbId} />
                            <p className="text-center text-[8px] text-gray-300 tracking-widest mt-1">
                                {selectedStub.movieId.padStart(6, '0')}-CINEMATCH
                            </p>
                        </div>

                        <div
                            className={`bg-[#2a2a2a] rounded-2xl mt-3 px-6 py-5 w-64 shadow-2xl transition-all duration-700 ease-in-out ${
                                isTearing ? 'opacity-0' : 'opacity-100'
                            }`}
                        >
                            <p className="text-white text-base font-black tracking-widest uppercase mb-1 text-center">
                                Mark as Watched
                            </p>
                            <p className="text-gray-400 text-sm text-center mb-4">Give it a rating</p>

                            <div className="flex gap-1.5 justify-center mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(null)}
                                        onClick={() => tearAndClose(selectedStub.dbId)}
                                        className="cursor-pointer transition-transform hover:scale-110"
                                    >
                                        <StarIcon
                                            className={`w-9 h-9 transition-colors ${
                                                star <= (hoveredStar ?? 0) ? 'text-[#E85D22]' : 'text-[#555]'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <p className="text-center text-[#E85D22] text-sm font-bold h-5 mb-4">
                                {hoveredStar ? RATING_LABELS[hoveredStar] : ''}
                            </p>

                            <div className="border-t border-white/10 mb-4" />

                            <button
                                onClick={() => tearAndClose(selectedStub.dbId)}
                                className="w-full text-center text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
                            >
                                Skip &amp; mark as watched
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;