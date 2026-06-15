import { useEffect, useMemo, useState } from 'react';
import AppCard from '../components/common/AppCard';
import ProgressRing from '../components/common/ProgressRing';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import progressService from '../features/progress/progress.service';
import type { BadgeItem, ContinueLearningItem, DashboardData, HistoryItem } from '../features/progress/progress.types';
import { useAuth } from '../context/useAuth';
import courseService from '../features/course/course.service';
import type { CourseListItem } from '../features/course/course.types';

const eventLabelMap: Record<HistoryItem['eventType'], string> = {
  lesson_viewed: 'Bạn đã xem một bài học mới.',
  lesson_completed: 'Bạn vừa hoàn thành một bài học.',
  quiz_submitted: 'Bạn đã nộp một bài quiz.',
  streak_updated: 'Chuỗi học tập vừa được cập nhật.',
  badge_unlocked: 'Bạn vừa mở khóa huy hiệu mới.',
};

const fallbackDashboard: DashboardData = {
  summary: {
    totalLearningMinutes: 0,
    currentStreakDays: 0,
    completedLessons: 0,
    overallProgressPercent: 0,
  },
  progressByLevel: {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  },
  recentBadges: [],
  recentHistory: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData>(fallbackDashboard);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [suggestedCourse, setSuggestedCourse] = useState<CourseListItem | null>(null);
  const [continueLearning, setContinueLearning] = useState<ContinueLearningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [dashboardResult, badgeResult, continueResult] = await Promise.all([
          progressService.getDashboard(),
          progressService.getMyBadges(),
          progressService.getContinueLearning(3),
        ]);
        const courseResult = await courseService.getCourses({ page: 1, limit: 1 });

        if (!mounted) return;
        setDashboard(dashboardResult);
        setBadges(badgeResult);
        setContinueLearning(continueResult);
        setSuggestedCourse(courseResult.courses[0] ?? null);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải bảng điều khiển.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const todayTasks = useMemo(() => {
    if (dashboard.recentHistory.length === 0) {
      return [
        'Hoàn thành một bài học trong khóa đang theo dõi.',
        'Làm 1 quiz ngắn trong phòng thực hành.',
        'Giữ streak bằng ít nhất 10 phút luyện tập.',
      ];
    }

    return dashboard.recentHistory.slice(0, 3).map((item) => eventLabelMap[item.eventType]);
  }, [dashboard.recentHistory]);

  const learningHours = (dashboard.summary.totalLearningMinutes / 60).toFixed(1);

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="site-container page-block loading-wrap">
          <div className="auth-loader" aria-hidden="true"></div>
          <p>Đang tải bảng điều khiển...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="site-container page-block dashboard-grid">
        <Reveal className="dashboard-main">
          <p className="section-kicker">Bảng điều khiển học tập</p>
          <h1>Xin chào {user?.name || 'bạn'}, hôm nay bạn muốn chơi bản nhạc nào?</h1>
          <p>
            Theo dõi tiến độ theo tuần, giữ chuỗi luyện tập và mở khóa bài học tiếp theo một cách nhẹ nhàng.
            Mọi chỉ số được thiết kế để tạo động lực, không gây áp lực.
          </p>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <div className="dashboard-stats">
            <AppCard>
              <span>Bài học đã hoàn thành</span>
              <strong>{dashboard.summary.completedLessons}</strong>
            </AppCard>
            <AppCard>
              <span>Tổng thời gian luyện</span>
              <strong>{learningHours} giờ</strong>
            </AppCard>
            <AppCard>
              <span>Chuỗi hiện tại</span>
              <strong>{dashboard.summary.currentStreakDays} ngày</strong>
            </AppCard>
          </div>

          <AppCard className="task-card">
            <h3>Kế hoạch luyện tập hôm nay</h3>
            <ul>
              {todayTasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
            <div className="hero-actions">
              <AppButton to="/thuc-hanh">Bắt đầu phiên luyện 25 phút</AppButton>
              <AppButton to="/khoa-hoc-cua-toi" variant="secondary">
                Mở khóa học của tôi
              </AppButton>
            </div>
          </AppCard>
        </Reveal>

        <Reveal className="dashboard-side" delay={120}>
          <AppCard className="ring-card">
            <ProgressRing value={dashboard.summary.overallProgressPercent} label="Mục tiêu tuần" />
            <p>
              Beginner: {dashboard.progressByLevel.beginner}% · Intermediate: {dashboard.progressByLevel.intermediate}% ·
              Advanced: {dashboard.progressByLevel.advanced}%
            </p>
          </AppCard>

          <AppCard>
            <h3>Huy hiệu gần đây</h3>
            <div className="badge-list">
              {badges.length === 0 ? <span className="soft-badge">Chưa có huy hiệu</span> : null}
              {badges.slice(0, 6).map((badge) => (
                <span key={`${badge.code}-${badge.unlockedAt}`} className="soft-badge">
                  {badge.name}
                </span>
              ))}
            </div>
          </AppCard>

          <AppCard>
            <h3>Gợi ý tiếp theo</h3>
            <p>
              {suggestedCourse
                ? `Khóa học phù hợp hiện tại: ${suggestedCourse.title}`
                : 'Chọn một khóa học trong thư viện để tiếp tục lộ trình học.'}
            </p>
            <AppButton to={suggestedCourse ? `/khoa-hoc/${suggestedCourse.slug}` : '/khoa-hoc'} variant="secondary">
              {suggestedCourse ? 'Mở khóa học gợi ý' : 'Mở thư viện khóa học'}
            </AppButton>
          </AppCard>

          <AppCard>
            <h3>Tiếp tục học</h3>
            {continueLearning.length === 0 ? (
              <p>Chưa có khóa học nào đang theo dõi. Hãy đăng ký một khóa để bắt đầu lộ trình cá nhân.</p>
            ) : (
              <div className="continue-learning-list">
                {continueLearning.map((item) => (
                  <div key={`${item.course.id}-${item.lesson.id}`} className="continue-learning-item">
                    <div>
                      <strong>{item.course.title}</strong>
                      <p>
                        {item.lesson.title} · {item.lesson.percent}% · {item.progressPercent}% toàn khóa
                      </p>
                    </div>
                    <AppButton to={`/khoa-hoc/${item.course.slug}/bai-hoc/${item.lesson.slug}`} variant="ghost">
                      Tiếp tục
                    </AppButton>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
