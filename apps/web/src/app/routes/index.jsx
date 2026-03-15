import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import ProtectedRoute from './protected.jsx'
import AuthLayout from '../../layouts/auth-layout.jsx'
import { LoadingScreen } from '../../components/common/loading-screen.jsx'

const AppLayout = lazy(() => import('../../layouts/app-layout.jsx'))
const LoginPage = lazy(() => import('../../features/auth/pages/Login.jsx'))
const ProjectsList = lazy(() => import('../../features/projects/pages/ProjectsList.jsx'))
const ProjectDetail = lazy(() => import('../../features/projects/pages/ProjectDetail.jsx'))
const TaskDetail = lazy(() => import('../../features/tasks/pages/TaskDetail.jsx'))
const ProfilePage = lazy(() => import('../../features/profile/pages/Profile.jsx'))

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <AuthLayout />,
      children: [{ index: true, element: <LoginPage /> }],
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/projects" replace /> },
        { path: 'projects', element: <ProjectsList /> },
        { path: 'projects/:id', element: <ProjectDetail /> },
        { path: 'tasks/:id', element: <TaskDetail /> },
        { path: 'profile', element: <ProfilePage /> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/projects" replace />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading page..." />}>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      />
    </Suspense>
  )
}
