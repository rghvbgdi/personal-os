import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { ROUTES } from '@/constants/index.js';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
