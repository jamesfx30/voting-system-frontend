// src/pages/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { adminRegisterUser } from '../services/api';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminDashboard = () => {
    const [topCandidates, setTopCandidates] = useState([]);
    const [userVotingActivity, setUserVotingActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- New states for the admin registration form ---
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user'); // Default to 'user'
    const [registerMessage, setRegisterMessage] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    // --- End new states ---

    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = getAuthToken();
                console.log("AdminDashboard DEBUG: Token from localStorage:", token);

                if (!token) {
                    setError('Authentication token not found. Please log in as an admin.');
                    setLoading(false);
                    return;
                }

                try {
                    const decodedToken: any = jwtDecode(token);
                    if (decodedToken.role !== 'admin') {
                        setError('Access Denied: You do not have administrator privileges.');
                        setLoading(false);
                        return;
                    }
                    console.log("AdminDashboard DEBUG: Decoded user role:", decodedToken.role);
                } catch (decodeError) {
                    console.error("AdminDashboard DEBUG: Error decoding token:", decodeError);
                    setError('Invalid authentication token. Please log in again.');
                    setLoading(false);
                    return;
                }

                // --- THIS IS THE CORRECT API CALL, AS CONFIRMED BY YOUR server.js ---
                const candidatesResponse = await axios.get(`${API_BASE_URL}/reports/top-candidates`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTopCandidates(candidatesResponse.data);

                // API call for user voting activity remains the same
                const usersResponse = await axios.get(`${API_BASE_URL}/reports/user-voting-activity`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserVotingActivity(usersResponse.data);

            } catch (err: any) {
                console.error("Error fetching admin reports:", err);
                if (err.response) {
                    setError(`Error: ${err.response.status} - ${err.response.data.message || 'Server error'}`);
                } else if (err.request) {
                    setError('Error: No response from server. Check if backend is running.');
                } else {
                    setError('Error: An unexpected error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // --- New handleSubmit for admin user registration (remains unchanged) ---
    const handleAdminRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        setRegisterMessage('');
        setRegisterError('');
        setRegisterLoading(true);

        try {
            const response = await adminRegisterUser({
                username: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole
            });
            setRegisterMessage(response.message || 'User registered successfully!');
            // Clear form
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('user'); // Reset to default
        } catch (err: any) {
            setRegisterError(err.message || 'Failed to register user.');
            console.error("Admin user registration error:", err);
        } finally {
            setRegisterLoading(false);
        }
    };
    // --- End new handleSubmit ---


    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Loading reports...</div>;
    }

    if (error) {
        return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Admin Dashboard</h1>

            <h2>Top Candidates by Votes</h2>
            {topCandidates.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                        <tr style={tableHeaderStyle}>
                            <th style={tableHeaderStyle}>Candidate ID</th>
                            <th style={tableHeaderStyle}>Candidate Name</th>
                            <th style={tableHeaderStyle}>Poll Name</th> {/* Changed header to 'Poll Name' for clarity, as per server.js route */}
                            <th style={tableHeaderStyle}>Total Votes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Data fields remain consistent with your server.js's /reports/top-candidates endpoint */}
                        {topCandidates.map((candidate: any) => (
                            <tr key={candidate.candidate_id}>
                                <td style={tableCellStyle}>{candidate.candidate_id}</td>
                                <td style={tableCellStyle}>{candidate.candidate_name}</td>
                                <td style={tableCellStyle}>{candidate.poll_name}</td> {/* Directly uses candidate.poll_name from backend */}
                                <td style={tableCellStyle}>{candidate.total_votes_received}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No top candidates data available or no votes recorded.</p>
            )}

            <h2>User Voting Activity</h2>
            {userVotingActivity.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={tableHeaderStyle}>User ID</th>
                            <th style={tableHeaderStyle}>Username</th>
                            <th style={tableHeaderStyle}>Email</th>
                            <th style={tableHeaderStyle}>Total Paid (GHS)</th>
                            <th style={tableHeaderStyle}>Created At</th>
                            <th style={tableHeaderStyle}>Last Free Vote</th>
                            <th style={tableHeaderStyle}>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userVotingActivity.map((user: any) => (
                            <tr key={user.user_id}>
                                <td style={tableCellStyle}>{user.user_id}</td>
                                <td style={tableCellStyle}>{user.username}</td>
                                <td style={tableCellStyle}>{user.email}</td>
                                <td style={tableCellStyle}>GHS {(user.total_paid_amount_pesewas / 100).toFixed(2)}</td>
                                <td style={tableCellStyle}>{user.user_registered_at ? new Date(user.user_registered_at).toLocaleDateString() : 'N/A'}</td>
                                <td style={tableCellStyle}>{user.last_free_vote_date ? new Date(user.last_free_vote_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={tableCellStyle}>{user.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No user voting activity data available.</p>
            )}

            {/* --- ADMIN USER REGISTRATION SECTION (remains unchanged) --- */}
            <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Register New User (Admin Only)</h2>
                <form onSubmit={handleAdminRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label htmlFor="admin-username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
                        <input
                            id="admin-username"
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            required
                            disabled={registerLoading}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                        <input
                            id="admin-email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            required
                            disabled={registerLoading}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
                        <input
                            id="admin-password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            required
                            disabled={registerLoading}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-role" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role:</label>
                        <select
                            id="admin-role"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            disabled={registerLoading}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>
                    {registerError && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{registerError}</p>}
                    {registerMessage && <p style={{ color: 'green', textAlign: 'center', margin: '0' }}>{registerMessage}</p>}
                    <button
                        type="submit"
                        disabled={registerLoading}
                        style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: registerLoading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                    >
                        {registerLoading ? 'Registering...' : 'Register New User'}
                    </button>
                </form>
            </div>
            {/* --- END ADMIN USER REGISTRATION SECTION --- */}
        </div>
    );
};

// Basic inline styles (keep as before)
const tableHeaderStyle = {
    padding: '12px 15px',
    border: '1px solid #ddd',
    textAlign: 'left',
};

const tableCellStyle = {
    padding: '8px 15px',
    border: '1px solid #ddd',
    verticalAlign: 'top',
};

export default AdminDashboard;