/**
 * AppRouter — React Router v6 setup with Layout wrapper.
 */
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import './App.css';
import NavHeader from './components/NavHeader.jsx';
import PageFooter from './components/PageFooter.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import BackendBanner from './components/BackendBanner.jsx';
import Home from './pages/Home.jsx';
import SolvePage from './pages/SolvePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AlgorithmsPage from './pages/AlgorithmsPage.jsx';
import ApiExplorerPage from './pages/ApiExplorerPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

function Layout() {
  return (
    <div className="app-layout">
      <NavHeader />
      <OfflineBanner />
      <BackendBanner />
      <Outlet />
      <PageFooter />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'solve', element: <SolvePage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'algorithms', element: <AlgorithmsPage /> },
      { path: 'api-explorer', element: <ApiExplorerPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
