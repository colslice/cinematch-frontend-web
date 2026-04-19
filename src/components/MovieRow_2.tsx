import React from 'react';
import MovieCard_2 from './MovieCard_2';

interface MovieData {
    id: string;
    title: string;
    platform: string;
    genre: string;
    posterUrl: string;
}

interface MovieRowProps {
    movies: MovieData[];
    title: string;
    isLoading: boolean;
}

const MovieRow: React.FC<MovieRowProps> = ({ movies, title, isLoading }) => {
    return (
        <div className="flex flex-col mb-12 w-full">

            <h2 className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-6">
                {title}
            </h2>
            {isLoading ? (
                // THE SPINNER
                <div className="flex items-center justify-start h-40">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-[#E85D22] rounded-full animate-spin"></div>
                </div>
            ) : (
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandaroy snap-mandatory 
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {movies.map(movie => (
                    <MovieCard_2
                        id={movie.id}
                        key={movie.id}
                        title={movie.title}
                        platform={movie.platform}
                        genre={movie.genre}
                        posterUrl={movie.posterUrl}
                    />
                ))}
            </div>
            )}
        </div>
    );
};

export default MovieRow;