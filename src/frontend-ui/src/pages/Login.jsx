import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const [view, setView] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('username', data.username);
                navigate('/home');
            } else {
                setError(data.error || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert('Đăng ký thành công! Đang chuyển sang màn hình Đăng nhập.');
                setView('login');
            } else {
                setError(data.error || 'Đăng ký thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-body">
            <div className="bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div class="orb orb-3"></div>
            </div>

            {view === 'login' ? (
                <div className="auth-container animate-fade-up">
                    <h2 className="font-heading">Đăng Nhập</h2>
                    <div className="error-msg">{error}</div>
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Tên đăng nhập</label>
                            <input 
                                type="text" 
                                required 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <label>Mật khẩu</label>
                            <input 
                                type="password" 
                                required 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </div>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Vào Học Ngay'}
                        </button>
                    </form>
                    <div className="toggle-text">
                        Chưa có tài khoản? <span onClick={() => { setView('register'); setError(''); }}>Đăng ký</span>
                    </div>
                </div>
            ) : (
                <div className="auth-container animate-fade-up">
                    <h2 className="font-heading">Đăng Ký</h2>
                    <div className="error-msg">{error}</div>
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label>Tên đăng nhập</label>
                            <input 
                                type="text" 
                                required 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <label>Mật khẩu</label>
                            <input 
                                type="password" 
                                required 
                                minLength="6"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </div>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                        </button>
                    </form>
                    <div className="toggle-text">
                        Đã có tài khoản? <span onClick={() => { setView('login'); setError(''); }}>Đăng nhập</span>
                    </div>
                </div>
            )}
        </div>
    );
}
