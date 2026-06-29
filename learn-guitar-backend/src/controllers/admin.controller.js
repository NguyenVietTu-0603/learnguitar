import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Song from '../models/Song.model.js';
import Quiz from '../models/Quiz.model.js';
import Progress from '../models/Progress.model.js';
import StudentCourse from '../models/StudentCourse.model.js';
import Badge from '../models/Badge.model.js';
import UserBadge from '../models/UserBadge.model.js';
import LearningHistory from '../models/LearningHistory.model.js';

export const getAdminStats = async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    newUsersLast30Days,
    newUsersLast7Days,
    totalCourses,
    publishedCourses,
    totalSongs,
    totalQuizzes,
    totalEnrollments,
    totalProgressRecords,
    totalBadges,
    totalBadgeUnlocks,
    recentActivities,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Song.countDocuments(),
    Quiz.countDocuments(),
    StudentCourse.countDocuments(),
    Progress.countDocuments(),
    Badge.countDocuments(),
    UserBadge.countDocuments(),
    LearningHistory.countDocuments({ eventAt: { $gte: sevenDaysAgo } }),
  ]);

  const topUsers = await User.find()
    .sort({ currentStreakDays: -1 })
    .limit(5)
    .select('_id name email role currentStreakDays');

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('_id name email role createdAt isActive');

  const recentEnrollments = await StudentCourse.find()
    .sort({ enrolledAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .populate('courseId', 'title');

  const popularCourses = await StudentCourse.aggregate([
    { $group: { _id: '$courseId', enrollmentCount: { $sum: 1 } } },
    { $sort: { enrollmentCount: -1 } },
    { $limit: 10 },
  ]);

  const popularCourseIds = popularCourses.map((item) => item._id);
  const coursesInfo = await Course.find({ _id: { $in: popularCourseIds } }).select('_id title level enrollmentCount thumbnailUrl');

  const coursesWithEnrollment = popularCourses.map((item) => {
    const info = coursesInfo.find((c) => String(c._id) === String(item._id));
    return {
      id: String(item._id),
      title: info?.title || 'Unknown',
      level: info?.level || 'beginner',
      enrollmentCount: item.enrollmentCount,
      thumbnailUrl: info?.thumbnailUrl || '',
    };
  });

  res.json({
    success: true,
    data: {
      overview: {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          newLast30Days: newUsersLast30Days,
          newLast7Days: newUsersLast7Days,
        },
        content: {
          totalCourses,
          publishedCourses,
          unpublishedCourses: totalCourses - publishedCourses,
          totalSongs,
          totalQuizzes,
        },
        engagement: {
          totalEnrollments,
          totalProgressRecords,
          totalBadges,
          totalBadgeUnlocks,
          activitiesLast7Days: recentActivities,
        },
      },
      topUsers: topUsers.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        currentStreakDays: u.currentStreakDays,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      recentEnrollments: recentEnrollments.map((e) => ({
        id: String(e._id),
        user: e.userId ? { id: String(e.userId._id), name: e.userId.name, email: e.userId.email } : null,
        course: e.courseId ? { id: String(e.courseId._id), title: e.courseId.title } : null,
        enrolledAt: e.enrolledAt,
        status: e.status,
      })),
      popularCourses: coursesWithEnrollment,
    },
  });
};
