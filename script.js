// JavaScript for the Kanban board will be added here.

const columns = ['Backlog', 'To Do', 'Doing', 'Done'];
let tasks = []; // Array to store task objects

// DOM Elements
const kanbanBoard = document.getElementById('kanban-board');
const taskModal = document.getElementById('task-modal');
const taskForm = {
    title: document.getElementById('task-title'),
    details: document.getElementById('task-details'),
    workload: document.getElementById('task-workload'),
    saveButton: document.getElementById('save-task'),
    cancelButton: document.getElementById('cancel-task')
};
// Add a global variable to keep track of the task being edited
let editingTaskId = null;

// --- Iteration Data ---
let currentIteration = {
    id: 'current_sprint',
    title: 'Current Sprint',
    startDate: '',
    endDate: '',
    holidays: [], // Array of date strings (e.g., 'YYYY-MM-DD')
    workLimit: 0
};

// DOM Elements for Iteration Settings
const iterationStartDateInput = document.getElementById('iteration-start-date');
const iterationEndDateInput = document.getElementById('iteration-end-date');
const iterationWorkLimitInput = document.getElementById('iteration-work-limit');
const iterationHolidayDateInput = document.getElementById('iteration-holiday-date');
const addHolidayButton = document.getElementById('add-holiday-button');
const holidaysListDiv = document.getElementById('holidays-list');


// --- Iteration Settings Functions ---
function renderHolidays() {
    holidaysListDiv.innerHTML = ''; // Clear current list

    currentIteration.holidays.forEach((holidayDate, index) => {
        const holidayItem = document.createElement('div');
        holidayItem.classList.add('holiday-item');
        holidayItem.textContent = holidayDate;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-holiday-btn');
        removeButton.addEventListener('click', () => {
            currentIteration.holidays.splice(index, 1);
            renderHolidays(); // Re-render the list
            saveDataToLocalStorage(); // Save after removing a holiday
        });

        holidayItem.appendChild(removeButton);
        holidaysListDiv.appendChild(holidayItem);
    });
}

function loadIterationSettings() {
    if (iterationStartDateInput) iterationStartDateInput.value = currentIteration.startDate;
    if (iterationEndDateInput) iterationEndDateInput.value = currentIteration.endDate;
    if (iterationWorkLimitInput) iterationWorkLimitInput.value = currentIteration.workLimit || ''; // Set to empty string if 0 or null

    renderHolidays();
}

function saveIterationSettings() {
    // This function can be expanded when persistence is added.
    // For now, data is updated directly by event listeners.
    console.log("Iteration settings saved (in memory):", currentIteration);
}

// Event Listeners for Iteration Settings
if (iterationStartDateInput) {
    iterationStartDateInput.addEventListener('change', (event) => {
        currentIteration.startDate = event.target.value;
        // saveIterationSettings(); // This just console logs, saveDataToLocalStorage is comprehensive
        updateWorkloadDisplay(); 
        saveDataToLocalStorage();
    });
}
if (iterationEndDateInput) {
    iterationEndDateInput.addEventListener('change', (event) => {
        currentIteration.endDate = event.target.value;
        // saveIterationSettings();
        updateWorkloadDisplay(); 
        saveDataToLocalStorage();
    });
}
if (iterationWorkLimitInput) {
    iterationWorkLimitInput.addEventListener('input', (event) => { // Use 'input' for immediate feedback
        currentIteration.workLimit = parseInt(event.target.value, 10) || 0;
        // saveIterationSettings();
        updateWorkloadDisplay(); 
        saveDataToLocalStorage();
    });
}

if (addHolidayButton) {
    addHolidayButton.addEventListener('click', () => {
        const holidayDate = iterationHolidayDateInput.value;
        if (holidayDate && !currentIteration.holidays.includes(holidayDate)) {
            currentIteration.holidays.push(holidayDate);
            currentIteration.holidays.sort(); // Keep holidays sorted
            renderHolidays();
            iterationHolidayDateInput.value = ''; // Clear input
            // saveIterationSettings();
            saveDataToLocalStorage(); // Save after adding a holiday
        } else if (currentIteration.holidays.includes(holidayDate)) {
            alert("This holiday is already added.");
        } else {
            alert("Please select a valid date for the holiday.");
        }
    });
}


// --- Column Creation ---
function createColumns() {
    columns.forEach(columnName => {
        const columnDiv = document.createElement('div');
        columnDiv.classList.add('kanban-column');
        columnDiv.setAttribute('data-column-name', columnName); // For identifying the column

        // Drag and Drop Event Listeners for Columns
        columnDiv.addEventListener('dragover', (event) => {
            event.preventDefault(); // Allow drop
            // Check if the target is a column or tasks-container, but not a task-item itself
            if (event.target.classList.contains('kanban-column') || event.target.classList.contains('tasks-container')) {
                 // Add class to the column, not the tasks-container for consistent highlighting
                event.target.closest('.kanban-column').classList.add('dragover-column');
            }
        });

        columnDiv.addEventListener('dragenter', (event) => {
            event.preventDefault(); // Necessary for IE and some edge cases
            // Consistent with dragover, apply to the column
            if (event.target.classList.contains('kanban-column') || event.target.classList.contains('tasks-container')) {
                event.target.closest('.kanban-column').classList.add('dragover-column');
            }
        });

        columnDiv.addEventListener('dragleave', (event) => {
            // Remove highlight if leaving the column or its task container
            // Check relatedTarget to prevent flickering when moving over child elements
            const columnElement = event.target.closest('.kanban-column');
            if (columnElement && (!columnElement.contains(event.relatedTarget) || event.relatedTarget == null)) {
                 columnElement.classList.remove('dragover-column');
            }
        });

        columnDiv.addEventListener('drop', (event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData('text/plain');
            const targetColumnElement = event.target.closest('.kanban-column');
            
            if (targetColumnElement) {
                const targetColumnName = targetColumnElement.getAttribute('data-column-name');
                const taskIndex = tasks.findIndex(t => t.id === taskId);

                if (taskIndex > -1) {
                    // Prevent dropping in the same column if needed (optional)
                    // if (tasks[taskIndex].status !== targetColumnName) { ... }
                    tasks[taskIndex].status = targetColumnName;
                    renderTasks(); // Re-render the board
                    saveDataToLocalStorage(); // Save after task status change
                }
                targetColumnElement.classList.remove('dragover-column');
            }
            // The 'dragging' class is removed in the task's 'dragend' event
        });

        const h3 = document.createElement('h3');
        h3.textContent = columnName;
        columnDiv.appendChild(h3);

        const tasksContainer = document.createElement('div');
        tasksContainer.classList.add('tasks-container');
        columnDiv.appendChild(tasksContainer);

        // Add "Add Task" button to the first column ('Backlog')
        if (columnName === 'Backlog') {
            const addTaskButton = document.createElement('button');
            addTaskButton.textContent = 'Add New Task';
            addTaskButton.classList.add('add-task-btn');
            addTaskButton.addEventListener('click', () => openTaskModal(null, columnName));
            columnDiv.appendChild(addTaskButton);
        }

        kanbanBoard.appendChild(columnDiv);
    });
}

// --- Task Rendering ---
function renderTasks() {
    // Clear existing tasks from columns
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.innerHTML = '';
    });

    tasks.forEach(task => {
        const columnDiv = kanbanBoard.querySelector(`.kanban-column[data-column-name="${task.status}"] .tasks-container`);
        if (columnDiv) {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            taskElement.setAttribute('data-task-id', task.id);
            taskElement.setAttribute('draggable', 'true'); // Make task draggable
            taskElement.textContent = task.title; // Display title

            // Drag Start Event
            taskElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', task.id);
                // Add a class to the dragged element itself for styling
                event.target.classList.add('dragging');
            });

            // Drag End Event (to remove styling from the source element)
            taskElement.addEventListener('dragend', (event) => {
                event.target.classList.remove('dragging');
            });

            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-task-btn');
            editButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering task click if any
                openTaskModal(task.id);
            });
            taskElement.appendChild(editButton);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-task-btn');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            taskElement.appendChild(deleteButton);

            columnDiv.appendChild(taskElement);
        }
    });
}

// --- Task Modal ---
function openTaskModal(taskId = null, defaultStatus = columns[0]) {
    editingTaskId = taskId; // Keep track of the task being edited

    if (taskId) {
        // Editing existing task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            taskForm.title.value = task.title;
            taskForm.details.value = task.details;
            taskForm.workload.value = task.workload;
            // No need to set status here, it's not part of the modal form directly
        } else {
            console.error("Task not found for editing:", taskId);
            return; // Exit if task not found
        }
    } else {
        // Adding new task
        taskForm.title.value = '';
        taskForm.details.value = '';
        taskForm.workload.value = '';
        // Store the intended status for new tasks if provided (e.g., from 'Add Task' button in a specific column)
        taskModal.setAttribute('data-default-status', defaultStatus);
    }
    taskModal.style.display = 'block';
}

function closeTaskModal() {
    taskModal.style.display = 'none';
    editingTaskId = null; // Reset editing task ID
    taskModal.removeAttribute('data-default-status'); // Clear default status
}

// --- Task CRUD Operations ---
function saveTask() {
    const title = taskForm.title.value.trim();
    const details = taskForm.details.value.trim();
    const workload = parseFloat(taskForm.workload.value);

    if (!title) {
        alert("Task title is required.");
        return;
    }
    // Allow 0 workload, but not negative.
    if (isNaN(workload) || workload < 0) { 
        alert("Please enter a valid workload (non-negative number).");
        return;
    }

    if (editingTaskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex > -1) {
            tasks[taskIndex].title = title;
            tasks[taskIndex].details = details;
            tasks[taskIndex].workload = workload; // Ensure workload is updated
            // Status is not changed via this modal directly
            // iterationId is not changed during edit for now
        }
    } else {
        // Create new task
        const defaultStatus = taskModal.getAttribute('data-default-status') || columns[0];
        const newTask = {
            id: Date.now().toString(),
            title: title,
            details: details,
            workload: workload,
            status: defaultStatus, 
            iterationId: currentIteration.id // Assign current iteration ID
        };
        tasks.push(newTask);
    }

    closeTaskModal();
    renderTasks();
    updateWorkloadDisplay(); // Update workload display after save
    saveDataToLocalStorage();
}

function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
        updateWorkloadDisplay(); // Update workload display after delete
        saveDataToLocalStorage();
    }
}

// --- Local Storage Persistence ---
const LOCAL_STORAGE_KEY = 'kanbanBoardData';

function saveDataToLocalStorage() {
    const appData = {
        tasks: tasks,
        currentIteration: currentIteration
    };
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
        console.log('Data saved to local storage.');
        // Optional: Add a small visual cue to the user
    } catch (error) {
        console.error('Error saving data to local storage:', error);
        // Optional: Notify user of the error
    }
}

function loadDataFromLocalStorage() {
    try {
        const jsonData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (jsonData) {
            const parsedData = JSON.parse(jsonData);
            tasks = parsedData.tasks || [];
            // Ensure currentIteration has a default structure if it's missing or incomplete
            const defaultIteration = { id: 'current_sprint', title: 'Current Sprint', startDate: '', endDate: '', holidays: [], workLimit: 0 };
            currentIteration = { ...defaultIteration, ...(parsedData.currentIteration || {}) };
            
            console.log('Data loaded from local storage.');

            // Refresh UI with loaded data
            // createColumns(); // Columns are static, so re-calling might duplicate. Re-render tasks is enough.
            renderTasks();
            loadIterationSettings(); // This will also call renderHolidays
            updateWorkloadDisplay();
        } else {
            console.log('No data found in local storage. Starting fresh.');
            // Initialize with defaults if needed (current setup does this by variable initialization)
        }
    } catch (error) {
        console.error('Error loading data from local storage:', error);
        // If corrupted, might be good to clear it or start fresh
        // localStorage.removeItem(LOCAL_STORAGE_KEY); // Optionally clear corrupted data
        tasks = [];
        currentIteration = { id: 'current_sprint', title: 'Current Sprint', startDate: '', endDate: '', holidays: [], workLimit: 0 };
        // Then refresh UI to reflect the fresh state
        renderTasks();
        loadIterationSettings();
        updateWorkloadDisplay();
    }
}

// --- Workload Calculation and Display ---
const workloadBar = document.getElementById('workload-bar');
const workloadText = document.getElementById('workload-text');

function calculateTotalWorkload() {
    let totalWorkload = 0;
    tasks.forEach(task => {
        // Sum workload if the task is part of the current iteration
        if (task.iterationId === currentIteration.id) {
            totalWorkload += (parseFloat(task.workload) || 0);
        }
    });
    return totalWorkload;
}

function updateWorkloadDisplay() {
    if (!workloadBar || !workloadText) {
        console.warn("Workload display elements not found. Skipping update.");
        return;
    }

    const totalWorkload = calculateTotalWorkload();
    const workLimit = parseFloat(currentIteration.workLimit) || 0; // Default to 0 if not set

    workloadText.textContent = `${totalWorkload} / ${workLimit} hours`;

    let percentage = 0;
    if (workLimit > 0) {
        percentage = (totalWorkload / workLimit) * 100;
    }

    // Cap visual bar width at 100% for display, but text shows actual numbers
    const barPercentage = Math.min(percentage, 100);
    workloadBar.style.width = barPercentage + '%';

    // Change color if over limit
    if (workLimit > 0 && totalWorkload > workLimit) {
        workloadBar.style.backgroundColor = 'red'; // Overlimit
    } else {
        workloadBar.style.backgroundColor = '#4caf50'; // Default color (green)
    }
}


// --- Event Listeners ---
const saveDataButton = document.getElementById('save-data');
const loadDataButton = document.getElementById('load-data');

window.addEventListener('load', () => {
    createColumns(); // Sets up the basic column structure
    // loadDataFromLocalStorage will handle rendering tasks and setting up iteration/workload display
    loadDataFromLocalStorage(); 
    // If no data is in localStorage, the app will start with the initial empty/default states defined globally
    // and then these will be populated by loadIterationSettings, renderTasks, updateWorkloadDisplay
    // called within loadDataFromLocalStorage or if it finds no data.
});

taskForm.saveButton.addEventListener('click', saveTask);
taskForm.cancelButton.addEventListener('click', closeTaskModal);


taskForm.cancelButton.addEventListener('click', closeTaskModal);

if (saveDataButton) {
    saveDataButton.addEventListener('click', () => {
        saveDataToLocalStorage();
        alert('Data manually saved to Local Storage.');
    });
}

if (loadDataButton) {
    loadDataButton.addEventListener('click', () => {
        if (confirm("Loading data will overwrite current unsaved changes. Proceed?")) {
            loadDataFromLocalStorage();
            // UI is updated by loadDataFromLocalStorage itself
            alert('Data loaded from Local Storage.');
        }
    });
}


// Placeholder for future functions (iteration planning)

// Note: Removed placeholder drag-drop functions as they are now implemented.
