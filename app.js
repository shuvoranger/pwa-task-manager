// Task Manager Dashboard PWA
class TaskManager {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadData();
    this.render();
    this.updateStats();
    this.populateFilters();
  }

  initializeElements() {
    // Form elements
    this.taskList = document.getElementById('taskList');
    this.taskInput = document.getElementById('taskInput');
    this.addTaskBtn = document.getElementById('addTaskBtn');
    this.dateInput = document.getElementById('dateInput');
    this.projectInput = document.getElementById('projectInput');
    this.assigneeInput = document.getElementById('assigneeInput');
    this.priorityButtons = document.querySelectorAll('.priority-btn');
    this.editPriorityButtons = document.querySelectorAll('.edit-priority-buttons .priority-btn');
    
    // Filter elements
    this.filterFromDate = document.getElementById('filterFromDate');
    this.filterToDate = document.getElementById('filterToDate');
    this.filterProject = document.getElementById('filterProject');
    this.filterAssignee = document.getElementById('filterAssignee');
    this.filterPriority = document.getElementById('filterPriority');
    this.clearFilters = document.getElementById('clearFilters');
    
    // Stats elements
    this.todayTasksEl = document.getElementById('todayTasks');
    this.completedTasksEl = document.getElementById('completedTasks');
    this.pendingTasksEl = document.getElementById('pendingTasks');
    
    // Modal elements
    this.editModal = document.getElementById('editModal');
    this.editProjectInput = document.getElementById('editProjectInput');
    this.editAssigneeInput = document.getElementById('editAssigneeInput');
    this.editPriorityInput = document.getElementById('editPriorityInput');
    this.editTaskInput = document.getElementById('editTaskInput');
    this.closeModal = document.getElementById('closeModal');
    this.cancelEdit = document.getElementById('cancelEdit');
    this.saveEdit = document.getElementById('saveEdit');
    
    this.installBtn = document.getElementById('installBtn');
    
    // Initialize date to today
    const todayStr = new Date().toISOString().slice(0, 10);
    this.dateInput.value = todayStr;
    
    // Initialize filter dates to today
    this.filterFromDate.value = todayStr;
    this.filterToDate.value = todayStr;
    
    this.currentEditIndex = -1;
    this.currentEditDate = '';
  }

  bindEvents() {
    // Add task
    this.addTaskBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Priority button events
    this.priorityButtons.forEach(btn => {
      btn.addEventListener('click', () => this.selectPriority(btn));
    });

    // Date change
    this.dateInput.addEventListener('change', () => {
      this.render();
      this.updateStats();
    });

    // Filters
    this.filterFromDate.addEventListener('change', () => this.render());
    this.filterToDate.addEventListener('change', () => this.render());
    this.filterProject.addEventListener('change', () => this.render());
    this.filterAssignee.addEventListener('change', () => this.render());
    this.filterPriority.addEventListener('change', () => this.render());
    this.clearFilters.addEventListener('click', () => this.clearFilters());

    // Modal events
    this.closeModal.addEventListener('click', () => this.closeEditModal());
    this.cancelEdit.addEventListener('click', () => this.closeEditModal());
    this.saveEdit.addEventListener('click', () => this.saveEditTask());

    // PWA events
    this.setupPWA();
  }

  // Storage helpers
  loadAll() {
    try { 
      return JSON.parse(localStorage.getItem('tasksByDate')) || {}; 
    } catch { 
      return {}; 
    }
  }

  saveAll(data) { 
    localStorage.setItem('tasksByDate', JSON.stringify(data)); 
  }

  tasksFor(dateStr) {
    const all = this.loadAll();
    return all[dateStr] || [];
  }

  setTasksFor(dateStr, tasks) {
    const all = this.loadAll();
    all[dateStr] = tasks;
    this.saveAll(all);
  }

  // Task operations
  addTask() {
    const text = this.taskInput.value.trim();
    const project = this.projectInput.value.trim();
    const assignee = this.assigneeInput.value.trim();
    const priority = this.getSelectedPriority();
    const dateStr = this.dateInput.value || new Date().toISOString().slice(0, 10);
    
    if (!text) return;
    
    // Debug: Log the task being added
    console.log('Adding task:', { text, project, assignee, priority, dateStr });
    
    const list = this.tasksFor(dateStr);
    list.push({ 
      text, 
      project: project || 'No Project', 
      assignee: assignee || 'Unassigned', 
      priority: priority || 'medium',
      done: false, 
      createdAt: Date.now() 
    });
    
    this.setTasksFor(dateStr, list);
    this.taskInput.value = '';
    this.projectInput.value = '';
    this.assigneeInput.value = '';
    this.resetPriorityToDefault();
    
    this.render();
    this.updateStats();
    this.populateFilters();
  }

  selectPriority(clickedBtn) {
    // Remove active class from all priority buttons
    this.priorityButtons.forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    clickedBtn.classList.add('active');
  }

  getSelectedPriority() {
    const activeBtn = document.querySelector('.priority-buttons .priority-btn.active');
    return activeBtn ? activeBtn.dataset.priority : 'medium';
  }

  resetPriorityToDefault() {
    this.priorityButtons.forEach(btn => btn.classList.remove('active'));
    const mediumBtn = document.querySelector('.priority-buttons .priority-btn[data-priority="medium"]');
    if (mediumBtn) mediumBtn.classList.add('active');
  }

  setEditPriority(priority) {
    this.editPriorityButtons.forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.edit-priority-buttons .priority-btn[data-priority="${priority}"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }

  getEditPriority() {
    const activeBtn = document.querySelector('.edit-priority-buttons .priority-btn.active');
    return activeBtn ? activeBtn.dataset.priority : 'medium';
  }

  editTask(dateStr, index) {
    const tasks = this.tasksFor(dateStr);
    const task = tasks[index];
    
    this.currentEditIndex = index;
    this.currentEditDate = dateStr;
    
    this.editProjectInput.value = task.project;
    this.editAssigneeInput.value = task.assignee;
    this.setEditPriority(task.priority || 'medium');
    this.editTaskInput.value = task.text;
    
    this.editModal.style.display = 'flex';
  }

  saveEditTask() {
    if (this.currentEditIndex === -1) return;
    
    const tasks = this.tasksFor(this.currentEditDate);
    tasks[this.currentEditIndex].project = this.editProjectInput.value.trim() || 'No Project';
    tasks[this.currentEditIndex].assignee = this.editAssigneeInput.value.trim() || 'Unassigned';
    tasks[this.currentEditIndex].priority = this.getEditPriority();
    tasks[this.currentEditIndex].text = this.editTaskInput.value.trim();
    
    this.setTasksFor(this.currentEditDate, tasks);
    this.closeEditModal();
    this.render();
    this.updateStats();
    this.populateFilters();
  }

  closeEditModal() {
    this.editModal.style.display = 'none';
    this.currentEditIndex = -1;
    this.currentEditDate = '';
  }

  toggleTask(dateStr, index) {
    const list = this.tasksFor(dateStr);
    list[index].done = !list[index].done;
    this.setTasksFor(dateStr, list);
    this.render();
    this.updateStats();
  }

  deleteTask(dateStr, index) {
    const list = this.tasksFor(dateStr);
    list.splice(index, 1);
    this.setTasksFor(dateStr, list);
    this.render();
    this.updateStats();
    this.populateFilters();
  }

  // Rendering
  render() {
    const dateStr = this.dateInput.value || new Date().toISOString().slice(0, 10);
    const allTasks = this.tasksFor(dateStr);
    
    // Apply filters
    let filteredTasks = [];
    const fromDate = this.filterFromDate.value;
    const toDate = this.filterToDate.value;
    const projectFilter = this.filterProject.value;
    const assigneeFilter = this.filterAssignee.value;
    const priorityFilter = this.filterPriority.value;
    
    // Get tasks based on date range
    if (fromDate && toDate) {
      // Date range filtering
      filteredTasks = this.getTasksInDateRange(fromDate, toDate);
    } else if (fromDate) {
      // From date only
      filteredTasks = this.getTasksFromDate(fromDate);
    } else if (toDate) {
      // To date only
      filteredTasks = this.getTasksToDate(toDate);
    } else {
      // No date filter - use current date
      filteredTasks = allTasks;
    }
    
    // Apply project filter
    if (projectFilter) {
      filteredTasks = filteredTasks.filter(t => t.project === projectFilter);
    }
    
    // Apply assignee filter
    if (assigneeFilter) {
      filteredTasks = filteredTasks.filter(t => t.assignee === assigneeFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    }

    // Debug: Log filtered tasks
    console.log('Filtered tasks:', filteredTasks);
    console.log('Current date:', this.dateInput.value);

    this.taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
      console.log('No filtered tasks found, showing no-tasks message');
      const li = document.createElement('li');
      li.className = 'no-tasks';
      li.innerHTML = `
        <div class="no-tasks-content">
          <i class="fas fa-inbox"></i>
          <p>No tasks found for the selected date range and filters. Try adjusting your search criteria.</p>
        </div>
      `;
      this.taskList.appendChild(li);
      return;
    }

    filteredTasks.forEach((task, idx) => {
      const li = document.createElement('li');
      li.className = `task-item ${task.done ? 'done' : ''}`;
      
      // Debug: Log task data
      console.log('Rendering task:', task);
      
      li.innerHTML = `
        <div class="task-checkbox">
          <input type="checkbox" ${task.done ? 'checked' : ''} />
        </div>
        <div class="task-content">
          <div class="task-main">
            <span class="task-text">${task.text || 'No description'}</span>
            <div class="task-meta">
              <span class="date-tag">
                <i class="fas fa-calendar"></i> ${task.date ? this.formatDate(task.date) : 'Today'}
              </span>
              <span class="priority-tag priority-${task.priority || 'medium'}">
                <i class="fas fa-flag"></i> ${(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
              </span>
              <span class="project-tag">
                <i class="fas fa-folder"></i> ${task.project}
              </span>
              <span class="assignee-tag">
                <i class="fas fa-user"></i> ${task.assignee}
              </span>
            </div>
          </div>
          <div class="task-actions">
            <button class="edit-btn" title="Edit Task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Delete Task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      // Bind events
      const checkbox = li.querySelector('input[type="checkbox"]');
      const editBtn = li.querySelector('.edit-btn');
      const deleteBtn = li.querySelector('.delete-btn');

      checkbox.addEventListener('change', () => this.toggleTask(task.date || this.dateInput.value, task.originalIndex || idx));
      editBtn.addEventListener('click', () => this.editTask(task.date || this.dateInput.value, task.originalIndex || idx));
      deleteBtn.addEventListener('click', () => this.deleteTask(task.date || this.dateInput.value, task.originalIndex || idx));

      this.taskList.appendChild(li);
    });
    
    // Update stats for the filtered view
    this.updateStatsForFilteredTasks(filteredTasks);
  }

  updateStats() {
    const dateStr = this.dateInput.value || new Date().toISOString().slice(0, 10);
    const tasks = this.tasksFor(dateStr);
    
    const todayTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const pendingTasks = todayTasks - completedTasks;
    
    this.todayTasksEl.textContent = todayTasks;
    this.completedTasksEl.textContent = completedTasks;
    this.pendingTasksEl.textContent = pendingTasks;
  }

  updateStatsForFilteredTasks(filteredTasks) {
    const todayTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.done).length;
    const pendingTasks = todayTasks - completedTasks;
    
    this.todayTasksEl.textContent = todayTasks;
    this.completedTasksEl.textContent = completedTasks;
    this.pendingTasksEl.textContent = pendingTasks;
  }

  populateFilters() {
    const all = this.loadAll();
    const allTasks = Object.values(all).flat();
    
    // Get available projects and assignees
    const projects = [...new Set(allTasks.map(t => t.project))].filter(p => p);
    const assignees = [...new Set(allTasks.map(t => t.assignee))].filter(a => a);
    
    // Update project filter
    this.filterProject.innerHTML = '<option value="">All Projects</option>';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project;
      option.textContent = project;
      this.filterProject.appendChild(option);
    });
    
    // Update assignee filter
    this.filterAssignee.innerHTML = '<option value="">All Assignees</option>';
    assignees.forEach(assignee => {
      const option = document.createElement('option');
      option.value = assignee;
      option.textContent = assignee;
      this.filterAssignee.appendChild(option);
    });
  }

  clearFilters() {
    this.filterFromDate.value = '';
    this.filterToDate.value = '';
    this.filterProject.value = '';
    this.filterAssignee.value = '';
    this.filterPriority.value = '';
    this.render();
  }

  // Helper methods for date range filtering
  getTasksInDateRange(fromDate, toDate) {
    const all = this.loadAll();
    const tasks = [];
    
    // Convert dates to comparable format
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Ensure from date is before to date
    if (from > to) {
      [from, to] = [to, from];
    }
    
    // Get all dates in the range
    const currentDate = new Date(from);
    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dateTasks = all[dateStr] || [];
      
      // Add tasks with date information and original index
      dateTasks.forEach((task, idx) => {
        tasks.push({
          ...task,
          date: dateStr,
          originalIndex: idx
        });
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return tasks;
  }
  
  getTasksFromDate(fromDate) {
    const all = this.loadAll();
    const tasks = [];
    
    // Get all dates from fromDate onwards
    Object.keys(all).forEach(dateStr => {
      if (dateStr >= fromDate) {
        const dateTasks = all[dateStr] || [];
        dateTasks.forEach((task, idx) => {
          tasks.push({
            ...task,
            date: dateStr,
            originalIndex: idx
          });
        });
      }
    });
    
    return tasks;
  }
  
  getTasksToDate(toDate) {
    const all = this.loadAll();
    const tasks = [];
    
    // Get all dates up to toDate
    Object.keys(all).forEach(dateStr => {
      if (dateStr <= toDate) {
        const dateTasks = all[dateStr] || [];
        dateTasks.forEach((task, idx) => {
          tasks.push({
            ...task,
            date: dateStr,
            originalIndex: idx
          });
        });
      }
    });
    
    return tasks;
  }

  // Helper method to format dates
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().slice(0, 10)) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().slice(0, 10)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  // PWA functionality
  setupPWA() {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.installBtn.hidden = true;
      return;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('./service-worker.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });
    }

    // Handle install prompt
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (this.installBtn) {
        this.installBtn.hidden = false;
        console.log('Install prompt ready - button shown');
      } else {
        console.log('Install button not found');
      }
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.installBtn.hidden = true;
      deferredPrompt = null;
    });

    // Check if install button should be shown
    if (this.installBtn) {
      this.installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
          console.log('No install prompt available');
          return;
        }
        
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('Install prompt outcome:', outcome);
          
          if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
        } catch (error) {
          console.error('Install prompt error:', error);
        }
        
        deferredPrompt = null;
        this.installBtn.hidden = true;
      });
    }
  }

  loadData() {
    // Initialize with some sample data if empty
    const all = this.loadAll();
    console.log('Loaded data:', all);
    
    if (Object.keys(all).length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const sampleTasks = [
        {
          text: 'Welcome to Daily Task Manager!',
          project: 'Getting Started',
          assignee: 'You',
          priority: 'medium',
          done: false,
          createdAt: Date.now()
        }
      ];
      console.log('Adding sample task:', sampleTasks);
      this.setTasksFor(today, sampleTasks);
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new TaskManager();
});
