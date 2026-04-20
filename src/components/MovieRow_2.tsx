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
                <div className="flex items-center justify-start h-50">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-[#E85D22] rounded-full animate-spin items-center justify-center "></div>
                </div>
            ) : (
                <>
                    <div className={`transition-opacity duration-1000 ease-in-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}></div>
                    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory 
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
                    <div className={`transition-opacity duration-1000 ease-in-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}></div>
                </>
            )}
        </div>
    );
};

export default MovieRow;
