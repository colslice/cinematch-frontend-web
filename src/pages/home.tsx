import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieRow_1 from '../components/MovieRow_1';
import MovieRow_2 from '../components/MovieRow_2';

const HomeScreen: React.FC = () => {
    const [recommendedMovies, setRecommendedMovies] = useState<any[]>([]);
    const [genreMovies, setGenreMovies] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const userGenres = ["Drama", "Horror", "Animation"]; 

    const GENRE_MAP: Record<string, number> = {
        "Action": 28, "Adventure": 12, "Animation": 16,
        "Comedy": 35, "Drama": 18, "Horror": 27, "Sci-Fi": 878,
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                if (!storedUser) return;

                const user = JSON.parse(storedUser);
                const userID = user._id;
                const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

                const recResponse = await fetch('/api/recommend/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userID: userID })
                });
                const recData = await recResponse.json();
                
                const genrePromises = userGenres.map(async (genre) => {
                    const genreId = GENRE_MAP[genre] || 18; 
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
                    );
                    const tmdbData = await tmdbRes.json();
                    return { genre, movies: tmdbData.results };
                });

                const genreResults = await Promise.all(genrePromises);

                const formattedRecs = recData.map((movie: any) => formatMovie(movie));
                const formattedGenreData: Record<string, any[]> = {};
                genreResults.forEach(res => {
                    formattedGenreData[res.genre] = res.movies.map((m: any) => formatMovie(m));
                });

                console.log("Genres:", userGenres);
                console.log("Genre Results:", genreResults);
                console.log("Formatted:", formattedGenreData);
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

    const formatMovie = (movie: any) => ({
        id: movie.id.toString(),
        title: movie.title,
        platform: movie.providers?.[0] || 'TMDB Popular',
        genre: movie.genres?.[0]?.toUpperCase() || 'MOVIE',
        vote: movie.vote_average ? `${(movie.vote_average)}` : 'No Rating',
        posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    });

    return (
        <div className="min-h-fit bg-black text-white font-sans pb-20">
            {/* Navbar stays visible immediately */}
            <Navbar />
            <div className={`transition-opacity duration-1000 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* We pass isLoading down to the rows so they can handle the spinner */}
            <div className="max-w-full pl-16 pt-8">
                <MovieRow_1 
                    title="Picked For You Today" 
                    movies={recommendedMovies} 
                    isLoading={loading} 
                />
            </div>

            {userGenres.map((genre) => (
                <div key={genre} className="max-w-full pl-16 mt-8">
                    <MovieRow_2 
                        title={`Popular in ${genre}`} 
                        movies={genreMovies[genre] || []} 
                        isLoading={loading} 
                    />
                </div>
            ))}
            </div>
        </div>
    );
};

export default HomeScreen;
