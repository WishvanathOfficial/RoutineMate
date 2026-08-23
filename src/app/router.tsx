import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '@features/landing/LandingPage';
import LoginPage from '@features/auth/LoginPage';
import RegisterPage from '@features/auth/RegisterPage';
import DashboardPage from '@features/dashboard/DashboardPage';
import RoutinesPage from '@features/routines/RoutinesPage';
import RoutineDetailPage from '@features/routines/RoutineDetailPage';
import StatsPage from '@features/stats/StatsPage';
import CalendarPage from '@features/calendar/CalendarPage';
import ProfilePage from '@features/profile/ProfilePage';
import AppLayout from '@layouts/AppLayout/AppLayout';
import ProtectedRoute from '@components/ProtectedRoute/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/routines', element: <RoutinesPage /> },
      { path: '/routines/:id', element: <RoutineDetailPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
