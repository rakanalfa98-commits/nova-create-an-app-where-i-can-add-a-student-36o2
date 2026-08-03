// Public Supabase credentials for this project, provisioned by Nova.
export const supabaseUrl = "https://spprykvxafiopyzfozti.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcHJ5a3Z4YWZpb3B5emZvenRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDYzNTQsImexcC": "MjEwMTMyMjM1NH0.5L3ECCNsfdXIebVypFzF5sroguNmIAx4tXcsTs9HJ6U";

export async function supabaseFetch(path, options = {}) {
    const isAuthPath = path.startsWith('/auth');
    const url = isAuthPath ? `${supabaseUrl}${path}` : `${supabaseUrl}/rest/v1${path}`;

    const headers = {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add Authorization header if an access token is available and it's not a public auth endpoint like signup
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !isAuthPath) { // Auth endpoints handle their own token or don't need it for signup
        headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (accessToken && isAuthPath && !path.includes('/signup')) { // For auth endpoints like /user or /token
         headers['Authorization'] = `Bearer ${accessToken}`;
    }


    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        throw new Error(errorData.msg || errorData.message || 'An unknown error occurred.');
    }

    // For some auth endpoints (like sign up), the response might be empty or not JSON
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {}; // Return empty object for no content
    }

    return response.json();
}
