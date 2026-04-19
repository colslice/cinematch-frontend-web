import React from 'react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  id: string; // Added ID for routing
  title: string;
  platform: string;
  genre: string;
  match: string;
  posterUrl: string;
}

const MovieCard: React.FC<MovieCardProps> = ({ id, title, platform, genre, match, posterUrl }) => {
  return (
    /* Wrapping the card in a Link component */
    <Link to={`/movie/${id}`} className="block">
      <div className="group relative min-w-[280px] md:min-w-[460px] aspect-[2/1] rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-colors duration-300 hover:border-white/20">
        
        {/* Background Image */}
        <img 
          src={posterUrl} 
          alt={title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"></div>

        {/* Match Badge */}
        <div className="absolute top-3 right-3 bg-[#E85D22] text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg z-10">
          {match}
        </div>

        {/* Text Content */}
        <div className="absolute bottom-4 left-4 z-10 transform transition-transform duration-500 group-hover:-translate-y-1">
          <h3 className="text-white font-serif text-xl md:text-2xl mb-1 drop-shadow-md">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase drop-shadow-md">
            <span className="text-gray-400">{platform}</span>
            <span className="text-[#E85D22]">{genre}</span>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default MovieCard;