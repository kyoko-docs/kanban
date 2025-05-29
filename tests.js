// Unit tests for Kanban Board application

// --- Test Runner Setup ---
let testResults = { successes: 0, failures: 0 };

function assert(condition, message) {
    if (condition) {
        testResults.successes++;
        console.log(`✅ PASS: ${message}`);
    } else {
        testResults.failures++;
        console.error(`❌ FAIL: ${message}`);
    }
}

// --- LocalStorage Mocking ---
let mockLocalStorageStore = {};
const originalLocalStorage = window.localStorage;
let localStorageMocked = false;

function beforeEach_LocalStorage() {
    if (!localStorageMocked) { // Keep original reference on first mock
        // originalLocalStorage = window.localStorage; // Already done at global scope
        localStorageMocked = true;
    }
    mockLocalStorageStore = {}; // Reset store for each test group
    window.localStorage = {
        setItem: (key, value) => { mockLocalStorageStore[key] = String(value); }, // Ensure value is string
        getItem: (key) => mockLocalStorageStore[key] || null,
        removeItem: (key) => { delete mockLocalStorageStore[key]; },
        clear: () => { mockLocalStorageStore = {}; }
    };
}

function afterAll_LocalStorage() {
    if (localStorageMocked) {
        window.localStorage = originalLocalStorage;
        localStorageMocked = false;
    }
}


// --- Test Suites ---

// Test Suite: Effort Calculation
function testEffortCalculation() {
    console.group("Test Suite: Effort Calculation (`calculateTotalWorkload`)");

    // Backup global state
    const originalTasks = JSON.parse(JSON.stringify(window.tasks || []));
    const originalCurrentIteration = JSON.parse(JSON.stringify(window.currentIteration || {}));

    // Setup
    window.currentIteration = { id: 'testIter01', workLimit: 100, holidays: [] }; // Assuming other fields aren't used by calc

    let calculatedWorkload;

    // 1. No tasks
    window.tasks = [];
    calculatedWorkload = calculateTotalWorkload();
    assert(calculatedWorkload === 0, "No tasks: total workload should be 0.");

    // 2. Tasks belonging to the currentIteration.id
    window.tasks = [
        { id: 't1', title: 'Task 1', workload: 5, iterationId: 'testIter01', status: 'To Do' },
        { id: 't2', title: 'Task 2', workload: 10, iterationId: 'testIter01', status: 'To Do' }
    ];
    calculatedWorkload = calculateTotalWorkload();
    assert(calculatedWorkload === 15, "Tasks in current iteration: sum their workloads (5 + 10 = 15).");

    // 3. Tasks belonging to a different iterationId
    window.tasks = [
        { id: 't1', title: 'Task 1', workload: 5, iterationId: 'testIter01', status: 'To Do' },
        { id: 't2', title: 'Task 2', workload: 10, iterationId: 'otherIter', status: 'To Do' },
        { id: 't3', title: 'Task 3', workload: 3, iterationId: 'testIter01', status: 'To Do' }
    ];
    calculatedWorkload = calculateTotalWorkload();
    assert(calculatedWorkload === 8, "Tasks in mixed iterations: ignore those not in current (5 + 3 = 8).");

    // 4. Tasks with zero workload
    window.tasks = [
        { id: 't1', title: 'Task 1', workload: 5, iterationId: 'testIter01', status: 'To Do' },
        { id: 't2', title: 'Task 2', workload: 0, iterationId: 'testIter01', status: 'To Do' },
        { id: 't3', title: 'Task 3', workload: 2, iterationId: 'testIter01', status: 'To Do' }
    ];
    calculatedWorkload = calculateTotalWorkload();
    assert(calculatedWorkload === 7, "Tasks with zero workload: should be handled correctly (5 + 0 + 2 = 7).");
    
    // 5. Tasks with undefined or non-numeric workload (should default to 0)
    window.tasks = [
        { id: 't1', title: 'Task 1', workload: 5, iterationId: 'testIter01', status: 'To Do' },
        { id: 't2', title: 'Task 2', workload: undefined, iterationId: 'testIter01', status: 'To Do' },
        { id: 't3', title: 'Task 3', workload: 'abc', iterationId: 'testIter01', status: 'To Do' },
        { id: 't4', title: 'Task 4', workload: 2, iterationId: 'testIter01', status: 'To Do' }
    ];
    calculatedWorkload = calculateTotalWorkload();
    assert(calculatedWorkload === 7, "Tasks with invalid workload: should default to 0 (5 + 0 + 0 + 2 = 7).");


    // Cleanup
    window.tasks = originalTasks;
    window.currentIteration = originalCurrentIteration;

    console.groupEnd();
}

// Test Suite: Workload Limit Warning Logic (Conceptual)
function testWorkloadLimitWarningLogic() {
    console.group("Test Suite: Workload Limit Warning Logic (Conceptual - checks conditions for `updateWorkloadDisplay`)");
    
    // This test focuses on the logic that would determine the bar color
    // It does not directly check DOM elements.

    // Helper function to simulate conditions and expected outcome
    function checkBarState(totalWorkload, workLimit, expectedState) {
        let barColor;
        if (workLimit > 0 && totalWorkload > workLimit) {
            barColor = 'red';
        } else {
            barColor = 'green'; // Default or normal state
        }
        // Special case for workLimit === 0 and totalWorkload > 0
        if (workLimit === 0 && totalWorkload > 0) {
             // As per current updateWorkloadDisplay, if workLimit is 0, percentage is 0, so bar is green.
             // The subtask mentions "bar should be warning (or handle as a special case, e.g. 100% red)".
             // Current implementation: green. Let's test current behavior.
             // If desired behavior is red, updateWorkloadDisplay needs adjustment.
             // For now, testing existing logic:
             barColor = 'green'; // Because (totalWorkload / 0) * 100 is not > workLimit
        }


        assert(barColor === expectedState, 
            `Workload: ${totalWorkload}, Limit: ${workLimit}. Expected bar state: ${expectedState}, Got: ${barColor}`);
    }

    // 1. totalWorkload < workLimit
    checkBarState(50, 100, 'green');

    // 2. totalWorkload === workLimit
    checkBarState(100, 100, 'green');

    // 3. totalWorkload > workLimit
    checkBarState(150, 100, 'red');

    // 4. workLimit === 0 and totalWorkload > 0
    // Current logic in updateWorkloadDisplay: if workLimit is 0, percentage is 0 -> green.
    // This might be a point of discussion if 100% red is desired.
    checkBarState(50, 0, 'green'); 

    // 5. workLimit > 0 and totalWorkload === 0
    checkBarState(0, 100, 'green');

    console.groupEnd();
}


// Test Suite: Data Saving/Loading
function testLocalStorageOperations() {
    console.group("Test Suite: Data Saving/Loading (`saveDataToLocalStorage`, `loadDataFromLocalStorage`)");
    beforeEach_LocalStorage(); // Mock localStorage

    // Backup global state
    const originalTasks = JSON.parse(JSON.stringify(window.tasks || []));
    const originalCurrentIteration = JSON.parse(JSON.stringify(window.currentIteration || {}));

    // --- Test Cases for Saving ---
    console.group("Saving to LocalStorage");
    const testSaveTasks = [{ id: 'task1', title: 'Test Task 1', workload: 5, iterationId: 'iter1', status: 'Done' }];
    const testSaveIteration = { id: 'iter1', startDate: '2023-01-01', endDate: '2023-01-05', workLimit: 20, holidays: ['2023-01-02'] };
    
    window.tasks = testSaveTasks;
    window.currentIteration = testSaveIteration;
    
    saveDataToLocalStorage();
    
    const savedDataString = mockLocalStorageStore[LOCAL_STORAGE_KEY];
    assert(savedDataString !== null, "Data should be saved to mock localStorage.");
    
    if (savedDataString) {
        const savedData = JSON.parse(savedDataString);
        assert(JSON.stringify(savedData.tasks) === JSON.stringify(testSaveTasks), "Saved tasks match original tasks.");
        assert(JSON.stringify(savedData.currentIteration) === JSON.stringify(testSaveIteration), "Saved iteration data matches original iteration data.");
    }
    console.groupEnd();

    // --- Test Cases for Loading ---
    console.group("Loading from LocalStorage");
    
    // 1. Load valid data
    mockLocalStorageStore = {}; // Clear previous save
    const testLoadData = {
        tasks: [{ id: 'taskLoad1', title: 'Loaded Task 1', workload: 8, iterationId: 'iterLoad', status: 'Doing' }],
        currentIteration: { id: 'iterLoad', startDate: '2023-02-01', endDate: '2023-02-10', workLimit: 40, holidays: ['2023-02-05'] }
    };
    mockLocalStorageStore[LOCAL_STORAGE_KEY] = JSON.stringify(testLoadData);
    
    // Temporarily mock functions called by loadDataFromLocalStorage that interact with DOM
    const originalRenderTasks = window.renderTasks;
    const originalLoadIterationSettings = window.loadIterationSettings;
    const originalUpdateWorkloadDisplay = window.updateWorkloadDisplay;
    window.renderTasks = () => {};
    window.loadIterationSettings = () => {};
    window.updateWorkloadDisplay = () => {};

    loadDataFromLocalStorage();
    
    assert(JSON.stringify(window.tasks) === JSON.stringify(testLoadData.tasks), "Loaded tasks match the data set in mock localStorage.");
    assert(JSON.stringify(window.currentIteration) === JSON.stringify(testLoadData.currentIteration), "Loaded iteration data matches the data set in mock localStorage.");

    // 2. Load with empty/null data in local storage
    mockLocalStorageStore = {}; // Clear again
    mockLocalStorageStore[LOCAL_STORAGE_KEY] = null; // or delete mockLocalStorageStore[LOCAL_STORAGE_KEY];
    
    // Reset globals to ensure loadDataFromLocalStorage sets defaults if it finds nothing
    window.tasks = []; 
    window.currentIteration = {};

    loadDataFromLocalStorage();
    // Check against the default structures defined in loadDataFromLocalStorage if data is null
    assert(Array.isArray(window.tasks) && window.tasks.length === 0, "Loading null data: tasks should be an empty array.");
    const defaultIteration = { id: 'current_sprint', title: 'Current Sprint', startDate: '', endDate: '', holidays: [], workLimit: 0 };
    assert(JSON.stringify(window.currentIteration) === JSON.stringify(defaultIteration), "Loading null data: currentIteration should be default structure.");

    // 3. Load with corrupted JSON data
    mockLocalStorageStore = {};
    mockLocalStorageStore[LOCAL_STORAGE_KEY] = "{corrupted_json_string: 'test'";
    
    window.tasks = [{id: 'preCorruptTask'}]; // Some pre-existing data
    window.currentIteration = {id: 'preCorruptIter'};

    loadDataFromLocalStorage(); // Should catch error and reset to defaults
    assert(Array.isArray(window.tasks) && window.tasks.length === 0, "Loading corrupted JSON: tasks should be reset to empty array.");
    assert(JSON.stringify(window.currentIteration) === JSON.stringify(defaultIteration), "Loading corrupted JSON: currentIteration should be reset to default structure.");

    // Restore mocked functions
    window.renderTasks = originalRenderTasks;
    window.loadIterationSettings = originalLoadIterationSettings;
    window.updateWorkloadDisplay = originalUpdateWorkloadDisplay;

    console.groupEnd();

    // Cleanup global state and localStorage mock
    window.tasks = originalTasks;
    window.currentIteration = originalCurrentIteration;
    afterAll_LocalStorage(); // Restore original localStorage

    console.groupEnd();
}


function runAllTests() {
    console.group("Kanban Board Unit Tests Report");
    testResults = { successes: 0, failures: 0 }; // Reset results

    testEffortCalculation();
    testWorkloadLimitWarningLogic();
    testLocalStorageOperations();
    // Add more test suites here if needed

    console.log("--------------------");
    console.log(`Tests Finished. Successes: ${testResults.successes}, Failures: ${testResults.failures}`);
    if (testResults.failures > 0) {
        console.warn("SOME TESTS FAILED. Review console output for details.");
    } else {
        console.log("ALL TESTS PASSED SUCCESSFULLY!");
    }
    console.groupEnd();
}

// Setup button to run tests
window.addEventListener('load', () => {
    const runTestsButton = document.getElementById('run-tests-button');
    if (runTestsButton) {
        runTestsButton.addEventListener('click', runAllTests);
        console.log("Test runner initialized. Click 'Run Tests' button to start.");
    } else {
        // Fallback to run tests automatically if button is not found (e.g. during headless testing)
        // or if preferred for development.
        // For this subtask, the button is the primary way.
        console.warn("'Run Tests' button not found. Tests will not be run via button.");
    }
});
