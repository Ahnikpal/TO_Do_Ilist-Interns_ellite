const API_URL = 'http://localhost:5000/api';

// Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authToggle = document.getElementById('auth-toggle');
const nameGroup = document.getElementById('name-group');
const userDisplayName = document.getElementById('user-display-name');
const userInitials = document.getElementById('user-initials');
const logoutBtn = document.getElementById('logout-btn');
const taskList = document.getElementById('task-list');
const addTaskForm = document.getElementById('add-task-form');
const taskSearch = document.getElementById('task-search');
const taskSort = document.getElementById('task-sort');
const taskCount = document.getElementById('task-count');
const loadingIndicator = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');
const modalOverlay = document.getElementById('modal-overlay');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

// State
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
let isLoginMode = true;
let deleteTaskId = null;

// Initialization
function init() {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
    refreshIcons();
}

// Icon Refresher
function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Toast System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal Logic
function showModal(id) {
    deleteTaskId = id;
    modalOverlay.classList.remove('hidden');
}

function hideModal() {
    deleteTaskId = null;
    modalOverlay.classList.add('hidden');
}

modalCancel.addEventListener('click', hideModal);
modalConfirm.addEventListener('click', () => {
    if (deleteTaskId) {
        deleteTaskSync(deleteTaskId);
        hideModal();
    }
});

// UI Transitions
function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    updateAuthUI();
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    if (user && user.name) {
        userDisplayName.textContent = user.name;
        // Handle names with multiple spaces or just one name
        const parts = user.name.trim().split(/\s+/);
        userInitials.textContent = parts.length > 1 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0][0].toUpperCase();
    }
    fetchTasks();
}

function updateAuthUI() {
    if (isLoginMode) {
        authTitle.textContent = 'Welcome Back';
        nameGroup.classList.add('hidden');
        document.getElementById('auth-submit').textContent = 'Sign In';
        document.getElementById('toggle-text').textContent = "Don't have an account?";
        authToggle.textContent = 'Sign Up';
    } else {
        authTitle.textContent = 'Join TaskMaster';
        nameGroup.classList.remove('hidden');
        document.getElementById('auth-submit').textContent = 'Create Account';
        document.getElementById('toggle-text').textContent = "Already have an account?";
        authToggle.textContent = 'Sign In';
    }
    refreshIcons();
}

authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authSection.querySelector('.auth-card').style.animation = 'none';
    setTimeout(() => {
        authSection.querySelector('.auth-card').style.animation = 'fadeInScale 0.4s ease';
        updateAuthUI();
    }, 10);
});

// Auth Logic
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('auth-submit');
    const originalText = submitBtn.textContent;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const body = isLoginMode ? { email, password } : { name, email, password };

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-sm"></span> Processing...';
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Authentication failed');

        if (isLoginMode) {
            token = data.token;
            user = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            showToast(`Welcome back, ${user.name}!`);
            showDashboard();
        } else {
            isLoginMode = true;
            updateAuthUI();
            showToast('Account created! Please sign in.', 'success');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    user = null;
    showToast('Logged out successfully');
    showAuth();
});

// Task Logic
async function fetchTasks() {
    const search = taskSearch.value;
    const sort = taskSort.value;
    const url = new URL(`${API_URL}/tasks`);
    if (search) url.searchParams.append('search', search);
    if (sort) url.searchParams.append('sort', sort);

    showLoading(true);
    try {
        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch tasks');
        renderTasks(data);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderTasks(tasks) {
    taskList.innerHTML = '';
    const remaining = tasks.filter(t => !t.is_completed).length;
    taskCount.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    // Helper to prevent XSS
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    emptyState.classList.add('hidden');
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.style.animation = `slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.is_completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-title ${task.is_completed ? 'completed' : ''}">${escapeHTML(task.title)}</span>
            </div>
            <div class="task-actions" style="display: flex; gap: 0.25rem;">
                <button class="btn-icon edit-btn" data-id="${task.id}" title="Edit Task">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="btn-icon delete-btn" data-id="${task.id}" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id, checkbox.checked, checkbox));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => showModal(task.id));

        const editBtn = li.querySelector('.edit-btn');
        const titleSpan = li.querySelector('.task-title');
        
        editBtn.addEventListener('click', () => {
            if (li.classList.contains('editing')) {
                // If clicked again while editing, trigger blur which saves
                const input = li.querySelector('.edit-task-input');
                if (input) input.blur();
                return;
            }
            
            li.classList.add('editing');
            const currentText = titleSpan.textContent;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'edit-task-input';
            input.value = currentText;
            input.style.width = '100%';
            input.style.padding = '0.5rem';
            input.style.borderRadius = '0.5rem';
            input.style.border = '1px solid var(--primary)';
            input.style.outline = 'none';
            input.style.fontSize = '1.125rem';
            
            titleSpan.replaceWith(input);
            input.focus();
            
            editBtn.innerHTML = '<i data-lucide="check"></i>';
            editBtn.style.color = 'var(--success)';
            refreshIcons();
            
            let isSaving = false;
            
            const saveEdit = async () => {
                if (isSaving) return;
                isSaving = true;
                
                const newTitle = input.value.trim();
                li.classList.remove('editing');
                
                if (newTitle && newTitle !== currentText) {
                    input.replaceWith(titleSpan);
                    titleSpan.textContent = newTitle;
                    try {
                        const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ title: newTitle })
                        });
                        if (!response.ok) throw new Error('Failed to update task');
                        showToast('Task updated');
                    } catch (err) {
                        showToast(err.message, 'error');
                        titleSpan.textContent = currentText; // Rollback
                    }
                } else {
                    input.replaceWith(titleSpan);
                }
                
                editBtn.innerHTML = '<i data-lucide="edit-2"></i>';
                editBtn.style.color = ''; // Reset color
                refreshIcons();
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur(); // Trigger save
                }
                if (e.key === 'Escape') {
                    input.value = currentText;
                    input.blur(); // Revert
                }
            });
        });

        taskList.appendChild(li);
    });
    refreshIcons();
}

addTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('new-task-title');
    const submitBtn = addTaskForm.querySelector('.btn-add');
    const title = titleInput.value.trim();
    if (!title) return;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
        refreshIcons();

        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });
        if (!response.ok) throw new Error('Failed to add task');
        titleInput.value = '';
        showToast('Task added');
        fetchTasks();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="plus"></i>';
        refreshIcons();
    }
});

async function toggleTask(id, is_completed, element) {
    // Optimistic UI update
    const titleSpan = element.closest('.task-item').querySelector('.task-title');
    titleSpan.classList.toggle('completed', is_completed);

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_completed })
        });
        if (!response.ok) throw new Error('Failed to update task');
        // Silent refresh to ensure server state matches UI
        const tasksResponse = await fetch(`${API_URL}/tasks?sort=${taskSort.value}${taskSearch.value ? '&search='+taskSearch.value : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await tasksResponse.json();
        renderTasks(data);
    } catch (err) {
        showToast(err.message, 'error');
        // Rollback
        titleSpan.classList.toggle('completed', !is_completed);
        element.checked = !is_completed;
    }
}

async function deleteTaskSync(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        showToast('Task deleted');
        fetchTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Helpers
function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
    if (show) emptyState.classList.add('hidden');
}

// Search/Sort Debounce
let searchTimeout;
taskSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchTasks, 400);
});
taskSort.addEventListener('change', fetchTasks);

init();
