import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '@features/landing/LandingPage';
import LoginPage from '@features/auth/LoginPage';
import RegisterPage from '@features/auth/RegisterPage';
import DashboardPage from '@features/dashboard/DashboardPage';
import RoutinesPage from '@features/routines/RoutinesPage';
import RoutineDetailPage from '@features/routines/RoutineDetailPage';
import GoalsPage from '@features/goals/GoalsPage';
import GoalNewPage from '@features/goals/GoalNewPage';
import StatsPage from '@features/stats/StatsPage';
import AchievementsPage from '@features/achievements/AchievementsPage';
import JournalPage from '@features/journal/JournalPage';
import JournalEntryPage from '@features/journal/JournalEntryPage';
import CalendarPage from '@features/calendar/CalendarPage';
import ProfilePage from '@features/profile/ProfilePage';
import OnboardingPage from '@features/onboarding/OnboardingPage';
import AppLayout from '@layouts/AppLayout/AppLayout';
import ProtectedRoute from '@components/ProtectedRoute/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute onboardingRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
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
      { path: '/goals', element: <GoalsPage /> },
      { path: '/goals/new', element: <GoalNewPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/achievements', element: <AchievementsPage /> },
      { path: '/journal', element: <JournalPage /> },
      { path: '/journal/:date', element: <JournalEntryPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
