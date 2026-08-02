document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('add-student-form');
    const studentNameInput = document.getElementById('student-name-input');
    const studentList = document.getElementById('student-list');
    const noStudentsMessage = document.getElementById('no-students-message');

    let students = JSON.parse(localStorage.getItem('students')) || [];

    // Function to render all students
    const renderStudents = () => {
        studentList.innerHTML = ''; // Clear existing list
        if (students.length === 0) {
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
                        <span class="ml-1 text-base font-semibold text-gray-700">${student.starCount}</span>
                    </button>
                    <button data-id="${student.id}" data-type="flag" class="flex items-center text-red-500 hover:text-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 rounded-full p-1">
                        <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                        </svg>
                        <span class="ml-1 text-base font-semibold text-gray-700">${student.flagCount}</span>
                    </button>
                </div>
            `;
            studentList.appendChild(studentItem);
        });
    };

    // Function to save students to localStorage
    const saveStudents = () => {
        localStorage.setItem('students', JSON.stringify(students));
    };

    // Add student functionality
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = studentNameInput.value.trim();
        if (name) {
            const newStudent = {
                id: Date.now().toString(), // Simple unique ID
                name: name,
                starCount: 0,
                flagCount: 0
            };
            students.push(newStudent);
            saveStudents();
            renderStudents();
            studentNameInput.value = ''; // Clear input
        }
    });

    // Handle star/flag button clicks using event delegation
    studentList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const studentId = button.dataset.id;
            const type = button.dataset.type;

            const studentIndex = students.findIndex(s => s.id === studentId);
            if (studentIndex > -1) {
                if (type === 'star') {
                    students[studentIndex].starCount++;
                } else if (type === 'flag') {
                    students[studentIndex].flagCount++;
                }
                saveStudents();
                renderStudents(); // Re-render to update counts
            }
        }
    });

    // Initial render when the page loads
    renderStudents();
});