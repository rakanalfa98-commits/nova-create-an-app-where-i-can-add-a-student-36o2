import { supabase } from './src/lib/supabase.js'; // Import Supabase client

document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('add-student-form');
    const studentNameInput = document.getElementById('student-name-input');
    const studentList = document.getElementById('student-list');
    const noStudentsMessage = document.getElementById('no-students-message');
    const appMessage = document.getElementById('app-message'); // New: Message display area

    let students = []; // Students will now be managed by Supabase

    // Utility function to display messages
    const displayMessage = (message, type = 'info') => {
        appMessage.textContent = message;
        appMessage.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');
        
        if (type === 'success') {
            appMessage.classList.add('bg-green-100', 'text-green-700');
        } else if (type === 'error') {
            appMessage.classList.add('bg-red-100', 'text-red-700');
        } else { // info or default
            appMessage.classList.add('bg-blue-100', 'text-blue-700');
        }
        appMessage.classList.remove('hidden');

        setTimeout(() => {
            appMessage.classList.add('hidden');
        }, 5000); // Hide after 5 seconds
    };

    // Function to render all students
    const renderStudents = async () => {
        studentList.innerHTML = ''; // Clear existing list

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: true }); // Order by creation time

        if (error) {
            console.error('Error fetching students:', error.message);
            displayMessage(`Error loading students: ${error.message}`, 'error');
            noStudentsMessage.textContent = 'Error loading students.';
            noStudentsMessage.style.display = 'block';
            return;
        }

        students = data; // Update local students array with fetched data

        if (students.length === 0) {
            noStudentsMessage.textContent = 'No students added yet.';
            noStudentsMessage.style.display = 'block';
            return;
        } else {
            noStudentsMessage.style.display = 'none';
        }

        students.forEach(student => {
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
    };

    // Add student functionality
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = studentNameInput.value.trim();
        if (name) {
            // Insert new student into Supabase
            const { error } = await supabase
                .from('students')
                .insert([
                    { name: name, star_count: 0, flag_count: 0 } // Use snake_case for Supabase columns
                ]);

            if (error) {
                console.error('Error adding student:', error.message);
                displayMessage(`Error adding student: ${error.message}. Make sure RLS is configured.`, 'error');
                return;
            }
            
            studentNameInput.value = ''; // Clear input on success
            displayMessage(`Student "${name}" added successfully!`, 'success');
            renderStudents(); // Re-render to show the new student
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

            const student = students.find(s => s.id === studentId);
            if (student) {
                let updatePayload = {};
                if (type === 'star') {
                    updatePayload = { star_count: student.star_count + 1 };
                } else if (type === 'flag') {
                    updatePayload = { flag_count: student.flag_count + 1 };
                }

                // Update student counts in Supabase
                const { error } = await supabase
                    .from('students')
                    .update(updatePayload)
                    .eq('id', studentId); // Find student by ID

                if (error) {
                    console.error('Error updating student count:', error.message);
                    displayMessage(`Error updating count for ${student.name}: ${error.message}`, 'error');
                    return;
                }
                displayMessage(`${student.name}'s ${type} count updated!`, 'success');
                renderStudents(); // Re-render to update counts
            }
        }
    });

    // Initial render when the page loads
    renderStudents();
});