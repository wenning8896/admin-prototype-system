import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { HomeRedirect } from "./components/HomeRedirect";
import { AppShell } from "../layouts/AppShell";
import { ModuleDetailSlot } from "./components/ModuleDetailSlot";
import { ModulePageSlot } from "./components/ModulePageSlot";
import { SystemIndexRedirect } from "./components/SystemIndexRedirect";
import { LandingPage } from "../pages/LandingPage";
import { CertificationPage } from "../pages/CertificationPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    path: "/welcome",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/register/certification",
    element: <CertificationPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/:role/:system",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <SystemIndexRedirect />,
          },
          {
            path: ":moduleId",
            element: <ModulePageSlot />,
          },
          {
            path: ":moduleId/detail/:detailId",
            element: <ModuleDetailSlot />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
