import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface LoginFormState {
  email: string;
  password: string;
}

const initialState: LoginFormState = {
  email: '',
  password: '',
};

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isSubmitting, errorMessage, clearError } = useAuth();
  const navigate = useNavigate();

  const displayError = useMemo(() => localError ?? errorMessage, [localError, errorMessage]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setLocalError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      await login({ email: form.email, password: form.password });
      navigate('/');
    } catch {
      // Error is already managed by context.
    }
  };

  return (
    <main className="auth-layout auth-layout-login">
      <section className="auth-card">
        <p className="badge">Welcome Back</p>
        <h1>Đăng nhập</h1>
        <p className="auth-subtitle">Tiếp tục hành trình luyện guitar của bạn.</p>

        {displayError && <div className="auth-error">{displayError}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
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
                placeholder="Nhap mat khau"
                autoComplete="current-password"
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

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Dang dang nhap...' : 'Dang nhap'}
          </button>
        </form>

        <p className="auth-footnote">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </section>
    </main>
  );
}
