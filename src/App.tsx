import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Services = lazy(() => import('./pages/signup/services'));
const Splash = lazy(() => import('./pages/splash'));
const Create = lazy(() => import('./pages/signup/create'));
const Login = lazy(() => import('./pages/login'));
const Rating = lazy(() => import('./pages/signup/rating'));
const ForgotPassword = lazy(() => import('./pages/forgot-password.tsx'));
const Verify = lazy(() => import('./pages/signup/verify'));
const Genres = lazy(() => import('./pages/signup/genres.tsx'));
const Home = lazy(() => import('./pages/home.tsx'));
const MovieDetail = lazy(() => import('./pages/movie-detail'));
const Watchlist = lazy(() => import('./pages/watchlist'));
const Search = lazy(() => import('./pages/search.tsx'));
const Reviews = lazy(() => import('./pages/reviews.tsx'));

function App() {
  const user = localStorage.getItem('user');

  return (
    <BrowserRouter>
      {/* 2. Wrap Routes in Suspense. The fallback shows while the specific page chunk is downloading */}
      <Suspense 
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <span className="text-[#E85D22] font-serif italic text-2xl tracking-wider animate-pulse">Loading...</span>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={user ? <Home /> : <Splash />} />
          
          <Route path="/splash" element={<Splash />} />
          <Route path="/create" element={<Create />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/search" element={<Search />} />

          {/* Protected Routes */}
          <Route path="/reviews" element={user ? <Reviews /> : <Navigate to="/" />} />
          <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
          <Route path="/rating" element={user ? <Rating /> : <Navigate to="/" />} />
          <Route path="/services" element={user ? <Services /> : <Navigate to="/" />} />
          <Route path="/genres" element={user ? <Genres /> : <Navigate to="/" />} />
          <Route path="/movie/:id" element={user ? <MovieDetail /> : <Navigate to="/" />} />
          <Route path="/watchlist" element={user ? <Watchlist /> : <Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
