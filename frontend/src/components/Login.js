import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/auth/login', form);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response.data.error);
    }
    setLoading(false);
  };

  const handleSignUpClick = () => {
    const code = prompt('Enter special code:');
    if (code === 'SPEC1234') {
      navigate('/signup');
    } else {
      alert('Invalid special code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="page-container">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          onClick={handleSignUpClick}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Login;
