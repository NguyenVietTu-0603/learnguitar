import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialState: RegisterFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(initialState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isSubmitting, errorMessage, clearError } = useAuth();
  const navigate = useNavigate();

  const displayError = useMemo(() => localError ?? errorMessage, [localError, errorMessage]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const validate = (): string | null => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return 'Vui lòng điền đầy đủ thông tin.';
    }

    if (form.password.length < 6) {
      return 'Mật khẩu tối thiểu 6 ký tự.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }

    return null;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/');
    } catch {
      // Error is already managed by context.
    }
  };

  return (
    <main className="auth-layout auth-layout-register">
      <section className="auth-card">
        <p className="badge">Start Your Journey</p>
        <h1>Đăng ký</h1>
        <p className="auth-subtitle">Tạo tài khoản để truy cập các bài học guitar.</p>

        {displayError && <div className="auth-error">{displayError}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Họ và tên
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={onChange}
              placeholder="Nguyen Van A"
              autoComplete="name"
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="ban@email.com"
              autoComplete="email"
            />
          </label>

          <label>
            Mật khẩu
            <div className="password-wrap">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                placeholder="Toi thieu 6 ky tu"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'An' : 'Hien'}
              </button>
            </div>
          </label>

          <label>
            Nhập lại mật khẩu
            <div className="password-wrap">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={onChange}
                placeholder="Nhap lai mat khau"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? 'An' : 'Hien'}
              </button>
            </div>
          </label>

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Dang tao tai khoan...' : 'Dang ky'}
          </button>
        </form>

        <p className="auth-footnote">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}
