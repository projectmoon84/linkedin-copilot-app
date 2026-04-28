import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { PageErrorBoundary } from '@/components/layout/PageErrorBoundary'
import { PageSkeleton } from '@/components/layout/PageSkeleton'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProfileProvider } from '@/contexts/UserProfileContext'
import { queryClient } from '@/lib/query-client'

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
const ComposePage = lazy(() => import('@/pages/ComposePage').then((module) => ({ default: module.ComposePage })))
const PostsPage = lazy(() => import('@/pages/PostsPage').then((module) => ({ default: module.PostsPage })))
const InsightsPage = lazy(() => import('@/pages/InsightsPage').then((module) => ({ default: module.InsightsPage })))
const TrendsPage = lazy(() => import('@/pages/TrendsPage').then((module) => ({ default: module.TrendsPage })))
const CirclesPage = lazy(() => import('@/pages/CirclesPage').then((module) => ({ default: module.CirclesPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const VoicePage = lazy(() => import('@/pages/VoicePage').then((module) => ({ default: module.VoicePage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })))

function ProtectedShell() {
  return (
    <ProtectedRoute>
      <PageErrorBoundary>
        <AppShell />
      </PageErrorBoundary>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProfileProvider>
            <BrowserRouter>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary>
                          <OnboardingPage />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route element={<ProtectedShell />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/compose" element={<ComposePage />} />
                    <Route path="/posts" element={<PostsPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/trends" element={<TrendsPage />} />
                    <Route path="/circles" element={<CirclesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/voice" element={<VoicePage />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </UserProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
