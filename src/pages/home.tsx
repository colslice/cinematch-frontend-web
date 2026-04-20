import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieRow_1 from '../components/MovieRow_1';
import MovieRow_2 from '../components/MovieRow_2';

const HomeScreen: React.FC = () => {
    const [recommendedMovies, setRecommendedMovies] = useState<any[]>([]);
    const [genreMovies, setGenreMovies] = useState<Record<number, any[]>>({});
    const [loading, setLoading] = useState(true); 

    const GENRE_MAP: Record<string, number> = {
        Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
        Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
        Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, 'Sci-Fi': 878,
        'TV Movie': 10770, Thriller: 53, War: 10752, Western: 37
    };

    const GENRE_ID_TO_NAME: Record<number, string> = Object.fromEntries(
        Object.entries(GENRE_MAP).map(([name, id]) => [id, name])
    );

    const fetchProviders = async (movieId: number, apiKey: string) => {
        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=watch/providers`
            );

            if (!res.ok) return [];

            const data = await res.json();

            return data['watch/providers']?.results?.US?.flatrate?.map(
                (p: any) => p.provider_name
            ) || [];

        } catch {
            return [];
        }
    };

    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const userID = user._id;

    const userGenreIds: number[] = (user.FavGenre || [])
        .map((g: string) =>
            GENRE_MAP[
                Object.keys(GENRE_MAP).find(
                    k => k.toLowerCase() === g.toLowerCase()
                ) || ''
            ]
        )
        .filter(Boolean);

    useEffect(() => { 
        const fetchAllData = async () => {
            try {
                const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

                // Fetch recommendations
                const recResponse = await fetch('/api/recommend/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userID })
                });

                const recData = await recResponse.json();

                // Fetch genre-based movies
                const genreResults = await Promise.all(
                    userGenreIds.map(async (genreId) => {
                        const tmdbRes = await fetch(
                            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=500`
                        );
                        const tmdbData = await tmdbRes.json();

                        return {
                            genreId,
                            movies: Array.isArray(tmdbData.results) ? tmdbData.results : []
                        };
                    })
                );

                // Hydrate recommendations with providers (limit to 8)
                const formattedRecs = Array.isArray(recData)
                    ? await Promise.all(
                        recData.slice(0, 8).map(async (movie: any) => {
                            const providers = await fetchProviders(movie.id, TMDB_API_KEY);
                            return formatMovie(movie, providers);
                        })
                    )
                    : [];

                // Hydrate genre rows with providers (limit to 8 per row)
                const formattedGenreData: Record<number, any[]> = {};

                for (const res of genreResults) {
                    formattedGenreData[res.genreId] = await Promise.all(
                        res.movies.slice(0, 8).map(async (movie: any) => {
                            const providers = await fetchProviders(movie.id, TMDB_API_KEY);
                            return formatMovie(movie, providers);
                        })
                    );
                }

                setRecommendedMovies(formattedRecs);
                setGenreMovies(formattedGenreData);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const formatMovie = (movie: any, providers: string[] = []) => {
        let firstGenreId: number | undefined;

        if (movie.genre_ids?.length) {
            firstGenreId = movie.genre_ids[0];
        } else if (movie.genres?.length) {
            if (typeof movie.genres[0] === 'object') {
                firstGenreId = movie.genres[0].id;
            } else if (typeof movie.genres[0] === 'string') {
                const match = Object.entries(GENRE_MAP).find(
                    ([name]) => name.toLowerCase() === movie.genres[0].toLowerCase()
                );
                firstGenreId = match?.[1];
            }
        }

        return {
            id: movie.id.toString(),
            title: movie.title,
            platform: providers[0] || 'Unavailable',
            genre: firstGenreId
                ? (GENRE_ID_TO_NAME[firstGenreId] ?? 'MOVIE').toUpperCase()
                : 'MOVIE',
            vote: movie.vote_average ? `${movie.vote_average}` : 'No Rating',
            posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        };
    };

    return (
        <div className="min-h-fit bg-black text-white font-sans pb-20">
            <Navbar />
            <div className={`transition-opacity duration-1000 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
            
                <div className="max-w-full pl-16 pt-8">
                    <MovieRow_1 
                        title="Picked For You Today" 
                        movies={recommendedMovies} 
                        isLoading={loading} 
                    />
                </div>

                {userGenreIds.map((genreId) => {
                    const genreName = GENRE_ID_TO_NAME[genreId] || 'Unknown';

                    return (
                        <div key={genreId} className="max-w-full pl-16 mt-8">
                            <MovieRow_2 
                                title={`Popular in ${genreName}`} 
                                movies={genreMovies[genreId] || []} 
                                isLoading={loading} 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HomeScreen;
