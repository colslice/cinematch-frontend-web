export const CONFIG = {
  API_BASE_URL: (window as any).APP_CONFIG?.API_BASE_URL || 'http://localhost:8080',
  TMDB_API_KEY: (window as any).APP_CONFIG?.TMDB_API_KEY || ''
};

export default CONFIG;
