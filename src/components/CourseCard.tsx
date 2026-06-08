import { Link } from 'react-router-dom'
import { Course, getExpert, formatPrice } from '../data/mock'

export default function CourseCard({ course }: { course: Course }) {
  const expert = getExpert(course.expertId)
  const isPaid = course.price > 0

  return (
    <Link
      to={`/academy/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
    >
      {/* 커버 */}
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${course.cover}`}>
        <span className="absolute inset-0 grid place-items-center text-5xl">
          {course.thumbEmoji}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-700">
          {course.category}
        </span>
        {course.isSubscriptionExcluded && isPaid && (
          <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
            단품 구매
          </span>
        )}
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold leading-snug text-stone-900 group-hover:text-amber-700">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{course.subtitle}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
          <span>{expert?.avatar}</span>
          <span className="font-medium text-stone-600">{expert?.name}</span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
          <span>⭐ {course.rating.toFixed(1)}</span>
          <span>· 수강 {course.studentCount.toLocaleString()}명</span>
          <span>· {course.lessonCount}강</span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-3">
          <span
            className={`text-lg font-black ${
              isPaid ? 'text-stone-900' : 'text-emerald-600'
            }`}
          >
            {formatPrice(course.price)}
          </span>
          <span className="text-sm font-semibold text-amber-600 group-hover:underline">
            자세히 →
          </span>
        </div>
      </div>
    </Link>
  )
}
