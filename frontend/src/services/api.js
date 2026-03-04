const API_BASE_URL = 'http://127.0.0.1:5000';

// Auth API calls
// Note: login is deprecated — authentication is handled by Supabase on the frontend.
// The Supabase access_token is passed directly as a Bearer token to robot routes.
export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Robot API calls
export const getRobots = async (token) => {
    const response = await fetch(`${API_BASE_URL}/robots`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch robots');
    return response.json();
};

export const createRobot = async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/robots`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create robot');
    }
    return response.json();
};

// Health check
export const healthCheck = async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
};
