import User from '../models/User.model.js';
import AppError from '../exceptions/AppError.js';

export const listUsers = async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
  ]);

  res.json({
    success: true,
    data: {
      items: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || '',
        isActive: u.isActive,
        currentStreakDays: u.currentStreakDays,
        lastLearningDate: u.lastLearningDate,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) {
    throw new AppError('Không tìm thấy người dùng.', 404);
  }

  res.json({
    success: true,
    data: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      isActive: user.isActive,
      currentStreakDays: user.currentStreakDays,
      lastLearningDate: user.lastLearningDate,
      createdAt: user.createdAt,
    },
  });
};

export const updateUser = async (req, res) => {
  const { name, role, avatar, isActive } = req.body;

  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng.', 404);
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) {
    if (!['student', 'teacher', 'admin'].includes(role)) {
      throw new AppError('Vai trò không hợp lệ. Chỉ chấp nhận: student, teacher, admin.', 400);
    }
    user.role = role;
  }
  if (avatar !== undefined) user.avatar = avatar;
  if (isActive !== undefined) user.isActive = Boolean(isActive);

  await user.save();

  res.json({
    success: true,
    message: 'Cập nhật người dùng thành công.',
    data: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      isActive: user.isActive,
      currentStreakDays: user.currentStreakDays,
      lastLearningDate: user.lastLearningDate,
      createdAt: user.createdAt,
    },
  });
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng.', 404);
  }

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new AppError('Không thể xóa admin cuối cùng của hệ thống.', 400);
    }
  }

  await User.deleteOne({ _id: req.params.userId });

  res.json({
    success: true,
    message: 'Đã xóa người dùng.',
  });
};
