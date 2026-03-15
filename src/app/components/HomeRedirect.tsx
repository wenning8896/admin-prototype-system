import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { getDefaultPathForRole } from "../../menu/resolver";

export function HomeRedirect() {
  const { isAuthenticated, user, isBootstrapped } = useAuth();
  const location = useLocation();

  if (!isBootstrapped) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Navigate to={getDefaultPathForRole(user.role)} replace />;
}
