import { supabaseUrl, supabaseAnonKey, supabaseFetch } from './src/lib/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const appMessage = document.getElementById('app-message');
    const authSection = document.getElementById('auth-section');
    const studentTrackerSection = document.getElementById('student-tracker-section');

    // Auth Forms
    const signupForm = document.getElementById('signup-form');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const showSigninBtn = document.getElementById('show-signin-btn');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showSignupContainer = document.getElementById('show-signup-container');

    const signinForm = document.getElementById('signin-form');
    const signinEmailInput = document.getElementById('signin-email');
    const signinPasswordInput = document.getElementById('signin-password');
    const signoutBtn = document.getElementById('signout-btn');

    // Student Tracker Elements
    const studentForm = document.getElementById('add-student-form');
    const studentNameInput = document.getElementById('student-name-input');
    const studentList = document.getElementById('student-list');
    const noStudentsMessage = document.getElementById('no-students-message');

    let accessToken = null;
    let currentUser = null;

    // Utility function to display messages
    const displayMessage = (message, type = 'info') => {
        appMessage.textContent = message;
        appMessage.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700', 'bg-yellow-100', 'text-yellow-700');
        
        if (type === 'success') {
            appMessage.classList.add('bg-green-100', 'text-green-700');
        } else if (type === 'error') {
            appMessage.classList.add('bg-red-100', 'text-red-700');
        } else if (type === 'warning') {
            appMessage.classList.add('bg-yellow-100', 'text-yellow-700');
        }
        else { // info or default
            appMessage.classList.add('bg-blue-100', 'text-blue-700');
        }
        appMessage.classList.remove('hidden');

        setTimeout(() => {
            appMessage.classList.add('hidden');
        }, 5000); // Hide after 5 seconds
    };

    // Update UI based on authentication status
    const updateUIForAuth = () => {
        if (accessToken && currentUser) {
            authSection.classList.add('hidden');
            studentTrackerSection.classList.remove('hidden');
            renderStudents(); // Load students for the logged-in user
        } else {
            authSection.classList.remove('hidden');
            studentTrackerSection.classList.add('hidden');
            signupForm.classList.remove('hidden');
            signinForm.classList.add('hidden');
            showSignupContainer.classList.add('hidden');
            // Clear student list when logged out
            studentList.innerHTML = '';
            noStudentsMessage.style.display = 'block';
            noStudentsMessage.textContent = 'Please sign in to view students.';
        }
    };

    // Check for existing session on page load
    const checkSession = async () => {
        accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            try {
                const userResponse = await supabaseFetch('/auth/v1/user', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                currentUser = userResponse;
                updateUIForAuth();
            } catch (error) {
                console.error('Session check failed:', error.message);
                displayMessage('Session expired or invalid. Please sign in again.', 'warning');
                accessToken = null;
                currentUser = null;
                localStorage.removeItem('accessToken');
                updateUIForAuth();
            }
        } else {
            updateUIForAuth();
        }
    };

    // --- Authentication Handlers ---
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;

        try {
            const response = await supabaseFetch('/auth/v1/signup', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.user) {
                displayMessage('Sign up successful! Please check your email for a confirmation link, then sign in.', 'success');
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
                // Optionally switch to sign-in form
                signinForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                showSignupContainer.classList.remove('hidden');
            } else {
                throw new Error(response.message || 'Sign up failed.');
            }
        } catch (error) {
            console.error('Sign up error:', error);
            displayMessage(`Sign up failed: ${error.message}`, 'error');
        }
    });

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signinEmailInput.value;
        const password = signinPasswordInput.value;

        try {
            const response = await supabaseFetch('/auth/v1/token?grant_type=password', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.access_token && response.user) {
                accessToken = response.access_token;
                currentUser = response.user;
                localStorage.setItem('accessToken', accessToken);
                displayMessage(`Welcome, ${currentUser.email}!`, 'success');
                signinEmailInput.value = '';
                signinPasswordInput.value = '';
                updateUIForAuth();
            } else {
                throw new Error(response.message || 'Sign in failed. Check your credentials.');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            displayMessage(`Sign in failed: ${error.message || 'Invalid credentials.'}`, 'error');
        }
    });

    signoutBtn.addEventListener('click', async () => {
        try {
            // Supabase client has a signOut method, but with supabaseFetch, it's a bit different.
            // For simplicity, we just clear local session.
            // A server-side logout would invalidate the token, but for a simple client app, clearing local storage is common.
            accessToken = null;
            currentUser = null;
            localStorage.removeItem('accessToken');
            displayMessage('You have been signed out.', 'info');
            updateUIForAuth();
        } catch (error) {
            console.error('Sign out error:', error);
            displayMessage(`Sign out failed: ${error.message}`, 'error');
        }
    });

    showSigninBtn.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
        showSigninBtn.parentElement.classList.add('hidden');
        showSignupContainer.classList.remove('hidden');
        appMessage.classList.add('hidden'); // Clear any messages
    });

    showSignupBtn.addEventListener('click', () => {
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        showSignupContainer.classList.add('hidden');
        showSigninBtn.parentElement.classList.remove('hidden');
        appMessage.classList.add('hidden'); // Clear any messages
    });


    // --- Student Management Functions ---
    const renderStudents = async () => {
        studentList.innerHTML = ''; // Clear existing list

        if (!currentUser) {
            noStudentsMessage.textContent = 'Please sign in to view students.';
            noStudentsMessage.style.display = 'block';
            return;
        }

        try {
            const data = await supabaseFetch(`/students?select=*&user_id=eq.${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (data.length === 0) {
                noStudentsMessage.textContent = 'No students added yet.';
                noStudentsMessage.style.display = 'block';
            } else {
                noStudentsMessage.style.display = 'none';
                data.forEach(student => {
                    const studentItem = document.createElement('div');
                    studentItem.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md';
                    studentItem.innerHTML = `
                        <span class="text-lg font-medium text-gray-800 truncate pr-2">${student.name}</span>
                        <div class="flex items-center space-x-4">
                            <button data-id="${student.id}" data-type="star" class="flex items-center text-yellow-500 hover:text-yellow-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-full p-1">
                                <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.332 9.306l8.332-1.151L12 .587z"/>
                                </svg>
                                <span class="ml-1 text-base font-semibold text-gray-700">${student.star_count}</span>
                            </button>
                            <button data-id="${student.id}" data-type="flag" class="flex items-center text-red-500 hover:text-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 rounded-full p-1">
                                <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                                </svg>
                                <span class="ml-1 text-base font-semibold text-gray-700">${student.flag_count}</span>
                            </button>
                        </div>
                    `;
                    studentList.appendChild(studentItem);
                });
            }
        } catch (error) {
            console.error('Error fetching students:', error.message);
            displayMessage(`Error loading students: ${error.message}`, 'error');
            noStudentsMessage.textContent = 'Error loading students.';
            noStudentsMessage.style.display = 'block';
        }
    };

    // Add student functionality
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = studentNameInput.value.trim();

        if (!currentUser) {
            displayMessage('Please sign in to add students.', 'warning');
            return;
        }

        if (name) {
            try {
                // Insert new student into Supabase
                const response = await supabaseFetch('/students', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ name: name, star_count: 0, flag_count: 0, user_id: currentUser.id })
                });

                if (response && response.length > 0) { // Supabase insert returns an array of inserted rows
                    studentNameInput.value = ''; // Clear input on success
                    displayMessage(`Student "${name}" added successfully!`, 'success');
                    renderStudents(); // Re-render to show the new student
                } else {
                    throw new Error('Failed to add student. No data returned.');
                }
            } catch (error) {
                console.error('Error adding student:', error);
                displayMessage(`Error adding student: ${error.message}. Make sure RLS is configured.`, 'error');
            }
        } else {
            displayMessage('Student name cannot be empty.', 'info');
        }
    });

    // Handle star/flag button clicks using event delegation
    studentList.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (button) {
            const studentId = button.dataset.id;
            const type = button.dataset.type;

            if (!currentUser) {
                displayMessage('Please sign in to update student counts.', 'warning');
                return;
            }

            try {
                // Fetch current student to get counts, then update
                const currentStudentData = await supabaseFetch(`/students?select=star_count,flag_count&id=eq.${studentId}&user_id=eq.${currentUser.id}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!currentStudentData || currentStudentData.length === 0) {
                    throw new Error('Student not found or not authorized.');
                }
                const student = currentStudentData[0];

                let updatePayload = {};
                if (type === 'star') {
                    updatePayload = { star_count: student.star_count + 1 };
                } else if (type === 'flag') {
                    updatePayload = { flag_count: student.flag_count + 1 };
                }

                // Update student counts in Supabase
                const response = await supabaseFetch(`/students?id=eq.${studentId}&user_id=eq.${currentUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(updatePayload)
                });

                if (response && response.length > 0) {
                    displayMessage(`Student's ${type} count updated!`, 'success');
                    renderStudents(); // Re-render to update counts
                } else {
                    throw new Error('Failed to update student count. No data returned.');
                }

            } catch (error) {
                console.error('Error updating student count:', error);
                displayMessage(`Error updating count: ${error.message}`, 'error');
            }
        }
    });

    // Initial check for session and UI update
    checkSession();
});