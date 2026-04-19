import{ BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Services from './pages/signup/services'
import Splash from './pages/splash'
import Create from './pages/signup/create'
import Login from  './pages/login'
import Rating from './pages/signup/rating'
import ForgotPassword from "./pages/forgot-password.tsx";
import Verify from './pages/signup/verify'
import Genres from './pages/signup/genres.tsx'
import Home from './pages/home.tsx'
import MovieDetail from './pages/movie-detail'
import Watchlist from './pages/watchlist'
import Search from './pages/search.tsx'
import React from 'react';

function App() {

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return null;
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const isFirstLogin = user?.NewUser;
  return (
    <BrowserRouter>
      <Routes>
      
        <Route path="/" element={user ? isFirstLogin ? <Navigate to="/services" /> : <Home /> : <Splash />} />
        
        <Route path="/splash" element={<Splash />} />
        <Route path="/create" element={<Create />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/search" element={<Search />} />

        {/* The following routes are protected and will only render if the user is authenticated. Otherwise, they will redirect to the splash page. */}
        {/* if you need to test these routes, uncomment them and ensure the user is authenticated */}

        {/*
        <Route path="/rating" element={<Rating />} />
        <Route path="/home" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/watchlist" element={<Watchlist />} />
        */}

        <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
        <Route path="/rating" element={user ? <Rating /> : <Navigate to="/" />} />
        <Route path="/services" element={user ? <Services /> : <Navigate to="/" />} />
        <Route path="/genres" element={user ? <Genres /> : <Navigate to="/" />} />
        <Route path="/movie/:id" element={user ? <MovieDetail /> : <Navigate to="/" />} />
        <Route path="/watchlist" element={user ? <Watchlist /> : <Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
  )
}

export default App;
