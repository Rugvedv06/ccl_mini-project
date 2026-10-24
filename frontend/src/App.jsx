import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AssignmentList from './pages/AssignmentList';
import AssignmentDetail from './pages/AssignmentDetail';
import AssignmentUpload from './pages/AssignmentUpload';
import MySubmissions from './pages/MySubmissions';
import SubmissionResult from './pages/SubmissionResult';
import AssignmentForm from './pages/AssignmentForm';
import SubmissionManagement from './pages/SubmissionManagement';
import EvaluationForm from './pages/EvaluationForm';
import EvaluationQueue from './pages/EvaluationQueue';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function HomeRedirect() {
  const { user, status } = useAuth();
  if (status === 'loading') return null;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomeRedirect />} />
            <Route
              path="/student"
              element={
                <RoleRoute role="student">
                  <StudentDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/faculty"
              element={
                <RoleRoute role="faculty">
                  <FacultyDashboard />
                </RoleRoute>
              }
            />
            <Route path="/assignments" element={<AssignmentList />} />
            <Route path="/assignments/:assignmentId" element={<AssignmentDetail />} />
            <Route
              path="/assignments/:assignmentId/upload"
              element={
                <RoleRoute role="student">
                  <AssignmentUpload />
                </RoleRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <RoleRoute role="student">
                  <MySubmissions />
                </RoleRoute>
              }
            />
            <Route path="/submissions/:submissionId" element={<SubmissionResult />} />
            <Route
              path="/faculty/assignments/new"
              element={
                <RoleRoute role="faculty">
                  <AssignmentForm />
                </RoleRoute>
              }
            />
            <Route
              path="/faculty/assignments/:assignmentId/edit"
              element={
                <RoleRoute role="faculty">
                  <AssignmentForm />
                </RoleRoute>
              }
            />
            <Route
              path="/faculty/assignments/:assignmentId/submissions"
              element={
                <RoleRoute role="faculty">
                  <SubmissionManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/faculty/evaluations"
              element={
                <RoleRoute role="faculty">
                  <EvaluationQueue />
                </RoleRoute>
              }
            />
            <Route
              path="/faculty/submissions/:submissionId/evaluate"
              element={
                <RoleRoute role="faculty">
                  <EvaluationForm />
                </RoleRoute>
              }
            />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
