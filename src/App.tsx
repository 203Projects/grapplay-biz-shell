import { Routes, Route, Navigate } from 'react-router-dom'
import AcademyLayout from './components/AcademyLayout'
import AcademyLanding from './pages/AcademyLanding'
import AcademyLibrary from './pages/AcademyLibrary'
import AcademyCourseDetail from './pages/AcademyCourseDetail'
import AcademyPricing from './pages/AcademyPricing'
import AcademyMyPage from './pages/AcademyMyPage'
import AcademyExperts from './pages/AcademyExperts'
import AcademyExpertReviews from './pages/AcademyExpertReviews'
import AcademyExpertDashboard from './pages/academy-expert/AcademyExpertDashboard'
import AcademyCourseEditor from './pages/academy-expert/AcademyCourseEditor'

export default function App() {
  return (
    <AcademyLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/academy" replace />} />
        <Route path="/academy" element={<AcademyLanding />} />
        <Route path="/academy/library" element={<AcademyLibrary />} />
        <Route path="/academy/courses/:id" element={<AcademyCourseDetail />} />
        <Route path="/academy/pricing" element={<AcademyPricing />} />
        <Route path="/academy/my" element={<AcademyMyPage />} />
        <Route path="/academy/experts" element={<AcademyExperts />} />
        <Route path="/academy/experts/:expertId/reviews" element={<AcademyExpertReviews />} />
        <Route path="/academy-expert/dashboard" element={<AcademyExpertDashboard />} />
        <Route path="/academy-expert/courses/new" element={<AcademyCourseEditor />} />
        <Route path="/academy-expert/courses/:id/edit" element={<AcademyCourseEditor />} />
        <Route path="*" element={<Navigate to="/academy" replace />} />
      </Routes>
    </AcademyLayout>
  )
}
