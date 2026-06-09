import { Routes, Route, Navigate } from 'react-router-dom'
import AcademyLayout from './components/AcademyLayout'
import AcademyLanding from './pages/AcademyLanding'
import AcademyLibrary from './pages/AcademyLibrary'
import AcademyCourseDetail from './pages/AcademyCourseDetail'
import AcademyMyPage from './pages/AcademyMyPage'
import AcademyEbooks from './pages/AcademyEbooks'
import AcademyEbookDetail from './pages/AcademyEbookDetail'
import AcademyExperts from './pages/AcademyExperts'
import AcademyExpertReviews from './pages/AcademyExpertReviews'
import AcademyExpertDashboard from './pages/academy-expert/AcademyExpertDashboard'
import AcademyCourseEditor from './pages/academy-expert/AcademyCourseEditor'
import AcademyEbookEditor from './pages/academy-expert/AcademyEbookEditor'
import AcademyCourseLearn from './pages/AcademyCourseLearn'
import AcademyEbookRead from './pages/AcademyEbookRead'
import AdminDashboard from './pages/admin/AdminDashboard'
import ContentHub from './pages/ContentHub'
import SearchResults from './pages/SearchResults'
import Contact from './pages/Contact'
import Terms from './pages/legal/Terms'
import Privacy from './pages/legal/Privacy'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFail from './pages/PaymentFail'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AcademyLayout>
      <Routes>
        <Route path="/" element={<AcademyLanding />} />
        <Route path="/library" element={<AcademyLibrary />} />
        <Route path="/courses/:id" element={<AcademyCourseDetail />} />
        <Route
          path="/learn/:id"
          element={
            <ProtectedRoute>
              <AcademyCourseLearn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my"
          element={
            <ProtectedRoute>
              <AcademyMyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/ebooks" element={<AcademyEbooks />} />
        <Route path="/ebooks/:id" element={<AcademyEbookDetail />} />
        <Route path="/content" element={<ContentHub />} />
        <Route path="/search" element={<SearchResults />} />
        <Route
          path="/read/:id"
          element={
            <ProtectedRoute>
              <AcademyEbookRead />
            </ProtectedRoute>
          }
        />
        <Route path="/experts" element={<AcademyExperts />} />
        <Route path="/experts/:expertId/reviews" element={<AcademyExpertReviews />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="/payments/fail" element={<PaymentFail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/expert/dashboard"
          element={
            <ProtectedRoute requireExpert>
              <AcademyExpertDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert/courses/new"
          element={
            <ProtectedRoute requireExpert>
              <AcademyCourseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert/courses/:id/edit"
          element={
            <ProtectedRoute requireExpert>
              <AcademyCourseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert/ebooks/new"
          element={
            <ProtectedRoute requireExpert>
              <AcademyEbookEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert/ebooks/:id/edit"
          element={
            <ProtectedRoute requireExpert>
              <AcademyEbookEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AcademyLayout>
  )
}
