import { Course } from '../data/mock'
import CourseCard from './CourseCard'

// 가로 스크롤 강의 캐러셀 (메인 마켓플레이스 섹션용)
export default function CourseCarousel({ courses }: { courses: Course[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {courses.map((c) => (
        <div key={c.id} className="w-64 shrink-0 snap-start sm:w-72">
          <CourseCard course={c} />
        </div>
      ))}
    </div>
  )
}
