// src/components/AuthForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginUser, registerUser } from '../services/api';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isSignUp) {
        response = await registerUser({ username: email, email, password, role: 'user' });
      } else {
        response = await loginUser({ email, password });
      }

      if (response.token) {
        login(response.token);
        navigate('/dashboard');
        console.log(`${isSignUp ? 'Sign up' : 'Login'} successful!`);
      } else if (response && response.message) { // <-- MODIFIED THIS LINE
        setError(response.message);
        console.error("Backend error message:", response.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error("Unexpected response from API:", response);
      }
    } catch (apiError) { // Catch errors thrown by makeRequest function
      // It's good practice to narrow the type if using TypeScript, but for JS, this is fine
      setError(apiError.message || 'Failed to connect to the server. Please try again later.');
      console.error("API call error:", apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        {isSignUp ? 'Sign Up' : 'Log In'}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        {error && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
        </button>
      </form>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        disabled={loading}
        style={{ marginTop: '15px', width: '100%', padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
      >
        Switch to {isSignUp ? 'Log In' : 'Sign Up'}
      </button>
    </div>
  );
}

export default AuthForm;