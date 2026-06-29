import { useEffect, useState, useCallback } from 'react';
import adminService from '../../features/admin/admin.service';
import type { AdminUser } from '../../features/admin/admin.service';

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Giảng viên',
  student: 'Học viên',
};

interface EditModalState {
  user: AdminUser | null;
  name: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [search, setSearch] = useState('');

  const [editModal, setEditModal] = useState<EditModalState>({ user: null, name: '', role: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers({
        page,
        limit: 20,
        role: filterRole || undefined,
        isActive: filterActive || undefined,
        search: search || undefined,
      });
      setUsers(data.items);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, filterActive, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (user: AdminUser) => {
    setEditModal({ user, name: user.name, role: user.role, isActive: user.isActive });
  };

  const handleSaveEdit = async () => {
    if (!editModal.user) return;
    setSaving(true);
    try {
      await adminService.updateUser(editModal.user.id, {
        name: editModal.name,
        role: editModal.role as 'student' | 'teacher' | 'admin',
        isActive: editModal.isActive,
      });
      showMsg('success', 'Cập nhật thành công!');
      setEditModal((p) => ({ ...p, user: null }));
      fetchUsers();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminService.deleteUser(deleteTarget.id);
      showMsg('success', 'Đã xóa người dùng.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      showMsg('success', `Đã ${user.isActive ? 'khóa' : 'mở khóa'} tài khoản.`);
      fetchUsers();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Thao tác thất bại.');
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Quản lý người dùng</h1>
        <p>Tổng cộng {total} người dùng</p>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            background: actionMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: actionMsg.type === 'success' ? '#059669' : '#dc2626',
            fontSize: 13,
          }}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <input
          className="form-input"
          placeholder="Tìm tên hoặc email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-input" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}>
          <option value="">Tất cả vai trò</option>
          <option value="student">Học viên</option>
          <option value="teacher">Giảng viên</option>
          <option value="admin">Quản trị viên</option>
        </select>
        <select className="form-input" value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Bị khóa</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="auth-loader" aria-hidden="true" /></div>
      ) : error ? (
        <p className="auth-error">{error}</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Chuỗi học</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Không có người dùng nào.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-user-avatar">🎸</div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280' }}>{u.email}</td>
                    <td><span className={`admin-badge admin-badge-${u.role}`}>{roleLabel[u.role] || u.role}</span></td>
                    <td>
                      <span className={`admin-badge admin-badge-${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>🔥 {u.currentStreakDays} ngày</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn-sm admin-btn-sm-primary" onClick={() => openEdit(u)}>Sửa</button>
                        <button
                          className="admin-btn-sm"
                          style={{ color: u.isActive ? '#dc2626' : '#059669' }}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.isActive ? 'Khóa' : 'Mở'}
                        </button>
                        <button className="admin-btn-sm admin-btn-sm-danger" onClick={() => setDeleteTarget(u)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <span>Trang {page} / {totalPages} · {total} kết quả</span>
            <div className="admin-pagination-btns">
              <button onClick={() => setPage(1)} disabled={page <= 1}>«</button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
              <span style={{ padding: '6px 12px' }}>{page}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editModal.user && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal((p) => ({ ...p, user: null }))}>
          <div className="admin-modal">
            <h3>Sửa người dùng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Tên</label>
                <input
                  className="form-input"
                  value={editModal.name}
                  onChange={(e) => setEditModal((p) => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Vai trò</label>
                <select
                  className="form-input"
                  value={editModal.role}
                  onChange={(e) => setEditModal((p) => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="student">Học viên</option>
                  <option value="teacher">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editModal.isActive}
                    onChange={(e) => setEditModal((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  <span style={{ fontSize: 13 }}>Tài khoản hoạt động</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-sm" onClick={() => setEditModal((p) => ({ ...p, user: null }))}>Hủy</button>
              <button className="admin-btn-sm admin-btn-sm-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Xác nhận xóa</h3>
            <p style={{ fontSize: 14, color: '#374151' }}>
              Bạn có chắc muốn xóa người dùng <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
              Hành động này không thể hoàn tác.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-btn-sm" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="admin-btn-sm admin-btn-sm-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
