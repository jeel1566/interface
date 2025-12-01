import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Instances from './pages/Instances';
import Workflows from './pages/Workflows';
import WorkflowExecute from './pages/WorkflowExecute';
import Executions from './pages/Executions';
import ExecutionDetail from './pages/ExecutionDetail';
import DashboardBuilder from './pages/DashboardBuilder';
import DashboardView from './pages/DashboardView';
import DashboardList from './pages/DashboardList';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardList />} />
            <Route path="/instances" element={<Instances />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/:workflowId/execute" element={<WorkflowExecute />} />
            <Route path="/executions" element={<Executions />} />
            <Route path="/executions/:runId" element={<ExecutionDetail />} />
            <Route path="/builder" element={<DashboardBuilder />} />
            <Route path="/dashboards/:dashboardId" element={<DashboardView />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
