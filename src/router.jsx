/**
 * AppRouter — React Router v6 setup with Layout wrapper.
 */
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import NavHeader from './components/NavHeader.jsx';
import PageFooter from './components/PageFooter.jsx';
import Home from './pages/Home.jsx';
import SolvePage from './pages/SolvePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AlgorithmsPage from './pages/AlgorithmsPage.jsx';

function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <NavHeader />
      <Outlet />
      <PageFooter />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'solve', element: <SolvePage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'algorithms', element: <AlgorithmsPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
