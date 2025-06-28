// src/services/api.ts

// TEMPORARY FIX: Hardcode API_BASE_URL to bypass 'process is not defined' error.
// We will find the correct way to use environment variables later based on your project setup.
const API_BASE_URL = 'http://localhost:5000/api'; // <--- IMPORTANT: Ensure this matches your backend URL!

if (!API_BASE_URL) {
    console.error("API_BASE_URL is not defined! This should ideally come from environment variables.");
}

// --- Helper Functions ---

// Centralized error handling for fetch responses
async function handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
        // If the response is not OK (e.g., 4xx or 5xx status codes),
        // throw an error that includes the backend's error message.
        const error = new Error(data.message || 'An unexpected error occurred');
        // You can attach more details to the error object if needed
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
    }
    return data;
}

// Helper to get authorization headers (consistent with AuthContext using 'authToken')
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken'); // Use 'authToken' for consistency
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// --- User & Auth Endpoints ---

export const registerUser = async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

export const loginUser = async (credentials: any) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    const data = await handleResponse(response);
    // Let AuthContext handle storing/decoding the token.
    // loginUser just returns the data received from the backend.
    return data;
};

export const logoutUser = () => {
    // AuthContext's logout function should remove 'authToken'
    // This function can be called by AuthContext or any component, if needed.
    localStorage.removeItem('authToken'); // Use 'authToken' for consistency
    localStorage.removeItem('user'); // If you're storing user payload separately
};

// Admin-only: Register a new user (admin can specify role)
export const adminRegisterUser = async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/register-user`, {
        method: 'POST',
        headers: getAuthHeaders(), // Requires admin token
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};


export const updateUserProfile = async (profileData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
    });
    return handleResponse(response);
};

export const getCurrentUser = async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};


// --- Poll & Voting Endpoints ---

export const fetchPolls = async () => {
    const response = await fetch(`${API_BASE_URL}/polls`);
    return handleResponse(response);
};

export const fetchPollDetails = async (pollId: number) => {
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}`);
    return handleResponse(response);
};

export const createPoll = async (pollData: { title: string; description?: string; candidates: { name: string }[] }) => {
    const response = await fetch(`${API_BASE_URL}/polls`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(pollData),
    });
    return handleResponse(response);
};

export const submitVote = async (pollId: number, candidateId: number) => {
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ candidate_id: candidateId }),
    });
    return handleResponse(response);
};

// Admin Poll Results (uses the admin-only route)
export const fetchAdminPollResults = async (pollId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/poll_results/${pollId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

// Admin Update Poll (uses the admin-only route)
export const updatePollAdmin = async (pollId: number, updateData: { title?: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/admin/polls/${pollId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
    });
    return handleResponse(response);
};

// --- Contestant Endpoints (from previous context, if you still need them) ---

export const getContestants = async () => {
    const response = await fetch(`${API_BASE_URL}/contestants`);
    return handleResponse(response);
};

export const getFreeVoteStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/user/free-vote-status`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

export const voteForContestant = async (contestantId: number, voteData: { amount?: number; voteType: 'free' | 'paid' }) => {
    const response = await fetch(`${API_BASE_URL}/contestants/${contestantId}/vote`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(voteData),
    });
    return handleResponse(response);
};