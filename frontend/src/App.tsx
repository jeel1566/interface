import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardBuilder from './pages/DashboardBuilder';
import DashboardView from './pages/DashboardView';
import DashboardList from './pages/DashboardList';
import Instances from './pages/Instances';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardList />} />
            <Route path="/instances" element={<Instances />} />
            <Route path="/builder" element={<DashboardBuilder />} />
            <Route path="/dashboards/:dashboardId" element={<DashboardView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
