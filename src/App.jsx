import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FileAnalysis from "./pages/FileAnalysis";
import Classification from "./pages/Classification";
import ThreatMonitoring from "./pages/ThreatMonitoring";
import AIPrediction from "./pages/AIPrediction";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="file-analysis" element={<FileAnalysis />} />
            <Route path="classification" element={<Classification />} />
            <Route path="threat-monitoring" element={<ThreatMonitoring />} />
            <Route path="ai-prediction" element={<AIPrediction />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
