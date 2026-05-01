import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-primary-500/30">
            <span className="text-2xl">💹</span>
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
