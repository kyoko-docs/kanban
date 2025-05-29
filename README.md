# Local-First Kanban Board

## Overview

A local-first Kanban board designed for personal use, focusing on task management with iteration planning and effort tracking. This application runs entirely in your web browser, utilizing local storage to keep your data private and on your machine.

Key features include:
*   A visual Kanban board with drag-and-drop task management.
*   Iteration planning with start/end dates, holiday tracking, and work limits.
*   Effort tracking for tasks.
*   Visual warnings for overallocation of work within an iteration.
*   All data saved directly in your browser's local storage.

## Features

*   **Kanban Board:**
    *   Customizable columns (Backlog, To Do, Doing, Done by default).
    *   Task creation with title, details, and effort.
    *   Task editing and deletion.
    *   Drag-and-drop functionality to move tasks between columns, updating their status.
*   **Iteration Management:**
    *   Define iteration periods (e.g., sprints) with specific start and end dates.
    *   Specify non-working holidays within an iteration.
    *   Set a total work limit (e.g., in hours) for the iteration.
*   **Effort Tracking:**
    *   Assign effort (e.g., in hours) to each task.
*   **Workload Visualization:**
    *   A progress bar visually represents the current total effort of tasks assigned to the iteration against the defined work limit.
    *   The bar turns red if the total effort exceeds the iteration limit, providing an immediate visual warning.
*   **Local Data Persistence:**
    *   All task and iteration data is saved in your browser's local storage. Changes are saved automatically.
    *   Manual "Save Data" and "Load Data" options are also available for explicit control.
*   **Unit Tests:**
    *   Includes a basic suite of unit tests for core application logic, runnable from the browser.

## Setup / How to Run

No complex setup, server, or build process is needed to run this application.

1.  **Clone the repository (or download the files):**
    ```bash
    git clone <repository_url> 
    ```
    (Or simply download the `index.html`, `style.css`, `script.js`, and `tests.js` files.)
2.  **Open `index.html`:**
    Navigate to the directory where you saved the files and open the `index.html` file directly in a modern web browser (e.g., Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).

## How to Use

### Initial Setup
1.  On first load, the board will be empty.
2.  Go to **"Iteration Settings"** to define your current sprint or work period:
    *   Set a **Start Date** and **End Date** for your iteration.
    *   Enter your **Work Limit** (e.g., 40 hours for a week). This is the total effort you aim to complete.
    *   Add any specific **Holidays** for the period by selecting a date and clicking "Add Holiday". These are non-working days.

### Managing Tasks
1.  Click the **"Add New Task"** button, typically located in the "Backlog" column (or your first configured column), to create a new task.
2.  Fill in the task's **Title**, **Details** (optional), and **Workload** (effort in hours). Click "Save Task".
3.  Tasks will appear in the column they were added to.
4.  Click on a task's **"Edit"** button to modify its details or workload. Click **"Delete"** to remove it (a confirmation will be asked).
5.  **Drag and drop tasks** between columns to update their status as you progress.

### Tracking Workload
1.  The **"Iteration Workload"** bar (below Iteration Settings) shows your total assigned task hours for the current iteration against your set limit.
2.  The bar will be green if you are within or at your limit. It will turn **red** if you exceed the limit, indicating overallocation.

### Saving Data
1.  Data is **automatically saved** to your browser's local storage as you create/edit/delete tasks, move them, or change iteration settings.
2.  You can also use the **"Save Data"** button for an explicit manual save.
3.  The **"Load Data"** button will manually reload the last saved state from local storage. **Be careful:** This will overwrite any current unsaved changes on the board.

### Running Tests (For Developers/Optional)
1.  Click the **"Run Tests"** button at the bottom of the page.
2.  The results of the built-in unit tests will be logged to the browser's developer console (usually accessible by pressing F12).

## Data Storage

This application uses your browser's **local storage** to save all your Kanban board data (tasks and iteration settings). This means your data stays private on your computer and is not sent to any external server.

**Important:** Clearing your browser's site data (cache, cookies, local storage, etc.) for the page where `index.html` is opened will permanently erase all your Kanban board data.
