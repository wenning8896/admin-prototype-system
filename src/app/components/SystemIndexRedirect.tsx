import { Navigate, useParams } from "react-router-dom";
import { getFirstLeafModuleId, getMenuForRoute } from "../../menu/resolver";

export function SystemIndexRedirect() {
  const { role, system } = useParams();
  const menu = getMenuForRoute(role, system);
  const firstModuleId = menu ? getFirstLeafModuleId(menu) : undefined;

  if (!role || !system || !firstModuleId) {
    return <Navigate to="/welcome" replace />;
  }

  return <Navigate to={`/${role}/${system}/${firstModuleId}`} replace />;
}
