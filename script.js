/***** Persistence Setup *****/
let tasks = [];
const storedTasks = localStorage.getItem('tasks');
if (storedTasks) {
  tasks = JSON.parse(storedTasks);
} else {
  tasks = [
    "Read a book",
    "Exercise",
    "Meditate",
    "Journal",
    "Clean up",
    "Go for a walk"
  ];
}
let timerDuration;
const storedSession = localStorage.getItem('sessionLength');
if (storedSession) {
  timerDuration = parseInt(storedSession) * 60;
  document.getElementById('sessionLength').value = storedSession;
} else {
  timerDuration = 25 * 60;
}
let breakDuration;
const storedBreak = localStorage.getItem('breakLength');
if (storedBreak) {
  breakDuration = parseInt(storedBreak) * 60;
  document.getElementById('breakLength').value = storedBreak;
} else {
  breakDuration = 5 * 60;
}
function updateTasksStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

/***** Global Timer Variables *****/
let currentTaskIndex = null;
let currentSelectedTask = "";
let currentTimerInterval = null;
let currentTimerTotal = null;
let currentTimerRemaining = null;
let timerType = null;  // "session" or "break"

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const breakButton = document.getElementById('breakButton');
const cancelButton = document.getElementById('cancelButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const selectedTaskDisplay = document.getElementById('selectedTask');
const timerOverlay = document.getElementById('timerOverlay');
const timerBackground = document.getElementById('timerBackground');
const progressCircle = document.getElementById('progressCircle');
const settingsIcon = document.getElementById('settingsIcon');
const settingsMenu = document.getElementById('settingsMenu');
const sessionLengthInput = document.getElementById('sessionLength');
const breakLengthInput = document.getElementById('breakLength');
const saveSettings = document.getElementById('saveSettings');
const addTaskButton = document.getElementById('addTaskButton');
const taskListDiv = document.getElementById('taskList');

let rotationAngle = 0;
let spinning = false;

/***** SVG Progress Bar Setup *****/
const RADIUS = 190;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
progressCircle.setAttribute('stroke-dasharray', CIRCUMFERENCE);
progressCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);

/***** Draw the Wheel *****/
function drawWheel(angle) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (tasks.length === 0) {
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No tasks available", canvas.width / 2, canvas.height / 2);
    return;
  }
  let numSegments = tasks.length;
  let segmentAngle = (2 * Math.PI) / numSegments;
  // Shift drawing by half a segment so that the center of segment 0 lines up at -90°.
  const offset = segmentAngle / 2; 
  for (let i = 0; i < numSegments; i++) {
    // Adjust startAngle by subtracting offset.
    const startAngle = angle + i * segmentAngle - Math.PI / 2 - offset;
    const endAngle = startAngle + segmentAngle;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, startAngle, endAngle);
    ctx.closePath();
    const colors = ["#ff9999", "#99ff99", "#9999ff", "#ffff99", "#99ffff", "#ff99ff"];
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    
    // Draw the segment text. Place it at the center of the segment.
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // The center of the segment is at startAngle + segmentAngle/2.
    let textAngle = startAngle + segmentAngle / 2;
    ctx.rotate(textAngle);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px Arial";
    ctx.fillText(tasks[i], Math.min(canvas.width, canvas.height) / 2 - 20, 10);
    ctx.restore();
  }
  // Pointer at top of wheel
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - (Math.min(canvas.width, canvas.height) / 2 - 10) + 25);
  ctx.lineTo(canvas.width / 2 - 20, canvas.height / 2 - (Math.min(canvas.width, canvas.height) / 2 - 10) - 5);
  ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2 - (Math.min(canvas.width, canvas.height) / 2 - 10) - 5);
  ctx.closePath();
  ctx.fill();
}


/***** Easing Function *****/
function easeOutQuad(t) {
  return t * (2 - t);
}

/***** Spin the Wheel *****/
function spinWheel() {
  if (spinning || tasks.length === 0) return;
  spinning = true;
  spinButton.style.display = "none";
  breakButton.style.display = "none";
  cancelButton.style.display = "none";
  pauseButton.style.display = "none";
  resetButton.style.display = "none";
  selectedTaskDisplay.textContent = "";
  timerOverlay.textContent = "";
  const spins = Math.floor(Math.random() * 3) + 4;
  const randomOffset = Math.random() * 2 * Math.PI;
  const totalRotation = spins * 2 * Math.PI + randomOffset;
  const duration = 5000;
  const startTime = performance.now();
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    let progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);
    rotationAngle = easedProgress * totalRotation;
    drawWheel(rotationAngle);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      const numSegments = tasks.length;
      const segmentAngle = (2 * Math.PI) / numSegments;
      let normalizedAngle = rotationAngle % (2 * Math.PI);
      let effectiveAngle = (2 * Math.PI - normalizedAngle + segmentAngle / 2) % (2 * Math.PI);
      let selectedIndex = Math.floor(effectiveAngle / segmentAngle) % numSegments;
      currentTaskIndex = selectedIndex;
      currentSelectedTask = tasks[selectedIndex];
      selectedTaskDisplay.textContent = "Selected Task: " + currentSelectedTask;
      timerBackground.style.display = "block";
      cancelButton.style.display = "inline-block";
      pauseButton.style.display = "inline-block";
      resetButton.style.display = "inline-block";
      startTimer(timerDuration);
    }
  }
  requestAnimationFrame(animate);
}
spinButton.addEventListener('click', spinWheel);

/***** Format Time *****/
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

/***** Timer Functions *****/
function startTimer(seconds) {
  currentTimerTotal = seconds;
  currentTimerRemaining = seconds;
  timerType = "session";
  timerOverlay.textContent = formatTime(currentTimerRemaining);
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  currentTimerInterval = setInterval(() => {
    currentTimerRemaining--;
    timerOverlay.textContent = formatTime(currentTimerRemaining);
    let percent = currentTimerRemaining / currentTimerTotal;
    let offset = CIRCUMFERENCE * (1 - percent);
    progressCircle.style.strokeDashoffset = offset;
    if (currentTimerRemaining < 0) {
      clearInterval(currentTimerInterval);
      currentTimerInterval = null;
      timerOverlay.textContent = "";
      timerBackground.style.display = "none";
      cancelButton.style.display = "none";
      pauseButton.style.display = "none";
      resetButton.style.display = "none";
      selectedTaskDisplay.textContent = ""; // Clear selected task text when time is up.
      if (timerType === "session" && currentTaskIndex !== null &&
          confirm("Session has ended. Would you like to remove the task: \"" + currentSelectedTask + "\" from the list?")) {
        tasks.splice(currentTaskIndex, 1);
        updateTasksStorage();
        renderTaskList();
        drawWheel(rotationAngle);
        currentTaskIndex = null;
        currentSelectedTask = "";
      }
      spinButton.style.display = "inline-block";
      breakButton.style.display = "inline-block";
    }
  }, 1000);
}

function startBreakTimer(seconds) {
  currentTimerTotal = seconds;
  currentTimerRemaining = seconds;
  timerType = "break";
  timerOverlay.textContent = formatTime(currentTimerRemaining);
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  timerBackground.style.display = "block";
  selectedTaskDisplay.textContent = ""; // Clear selected task while on break.
  currentTimerInterval = setInterval(() => {
    currentTimerRemaining--;
    timerOverlay.textContent = formatTime(currentTimerRemaining);
    let percent = currentTimerRemaining / currentTimerTotal;
    let offset = CIRCUMFERENCE * (1 - percent);
    progressCircle.style.strokeDashoffset = offset;
    if (currentTimerRemaining <= 0) {
      clearInterval(currentTimerInterval);
      currentTimerInterval = null;
      timerOverlay.textContent = "Break's over!";
      timerBackground.style.display = "none";
      cancelButton.style.display = "none";
      pauseButton.style.display = "none";
      resetButton.style.display = "none";
      setTimeout(() => {
        timerOverlay.textContent = "";
        spinButton.style.display = "inline-block";
        breakButton.style.display = "inline-block";
      }, 2000);
    }
  }, 1000);
}

/***** Timer Control Buttons *****/
function togglePauseTimer() {
  if (currentTimerInterval) {
    clearInterval(currentTimerInterval);
    currentTimerInterval = null;
    // Change icon to resume icon (play triangle)
    pauseButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>`;
  } else {
    // Restore pause icon
    pauseButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`;
    resumeTimer();
  }
}

function resumeTimer() {
  currentTimerInterval = setInterval(() => {
    currentTimerRemaining--;
    timerOverlay.textContent = formatTime(currentTimerRemaining);
    let percent = currentTimerRemaining / currentTimerTotal;
    let offset = CIRCUMFERENCE * (1 - percent);
    progressCircle.style.strokeDashoffset = offset;
    if (currentTimerRemaining <= 0) {
      clearInterval(currentTimerInterval);
      currentTimerInterval = null;
      timerOverlay.textContent = (timerType === "session") ? "Time's up!" : "Break's over!";
      timerBackground.style.display = "none";
      cancelButton.style.display = "none";
      pauseButton.style.display = "none";
      resetButton.style.display = "none";
      selectedTaskDisplay.textContent = "";
      if (timerType === "session" && currentTaskIndex !== null &&
          confirm("Session has ended. Would you like to remove the task: \"" + currentSelectedTask + "\" from the list?")) {
        tasks.splice(currentTaskIndex, 1);
        updateTasksStorage();
        renderTaskList();
        drawWheel(rotationAngle);
        currentTaskIndex = null;
        currentSelectedTask = "";
      }
      spinButton.style.display = "inline-block";
      breakButton.style.display = "inline-block";
    }
  }, 1000);
}

function resetTimer() {
  if (currentTimerInterval) {
    clearInterval(currentTimerInterval);
    currentTimerInterval = null;
  }
  currentTimerRemaining = currentTimerTotal;
  timerOverlay.textContent = formatTime(currentTimerRemaining);
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  togglePauseTimer(); // let timer tick down immediately
}

/***** Button Event Listeners *****/
breakButton.addEventListener('click', () => {
  spinButton.style.display = "none";
  breakButton.style.display = "none";
  cancelButton.style.display = "inline-block";
  pauseButton.style.display = "inline-block";
  resetButton.style.display = "inline-block";
  startBreakTimer(breakDuration);
});

cancelButton.addEventListener('click', () => {
  selectedTaskDisplay.textContent = ""; // Clear selected task if cancelled.
  if (currentTimerInterval) {
    clearInterval(currentTimerInterval);
    currentTimerInterval = null;
  }
  timerOverlay.textContent = "";
  timerBackground.style.display = "none";
  cancelButton.style.display = "none";
  pauseButton.style.display = "none";
  resetButton.style.display = "none";
  spinButton.style.display = "inline-block";
  breakButton.style.display = "inline-block";
});

pauseButton.addEventListener('click', togglePauseTimer);
resetButton.addEventListener('click', resetTimer);

/***** Editable Task List *****/
function renderTaskList() {
  taskListDiv.innerHTML = "";
  tasks.forEach((task, index) => {
    const taskDiv = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task;
    input.addEventListener('input', () => {
      tasks[index] = input.value;
      drawWheel(rotationAngle);
      updateTasksStorage();
    });
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = "&times;";
    deleteButton.addEventListener('click', () => {
      tasks.splice(index, 1);
      updateTasksStorage();
      renderTaskList();
      drawWheel(rotationAngle);
      spinButton.disabled = tasks.length === 0;
    });
    taskDiv.appendChild(input);
    taskDiv.appendChild(deleteButton);
    taskListDiv.appendChild(taskDiv);
  });
  spinButton.disabled = tasks.length === 0;
}

addTaskButton.addEventListener('click', (e) => {
    e.preventDefault();
    if(inputText.value !== ""){
        
        tasks.push(inputText.value);

        inputText.value = "";
        
        e.stopPropagation();
        updateTasksStorage();
        renderTaskList();
        drawWheel(rotationAngle);
    }
});


/***** Settings Menu Handlers *****/
settingsIcon.addEventListener('click', () => {
  settingsMenu.style.display = (settingsMenu.style.display === "block") ? "none" : "block";
});

saveSettings.addEventListener('click', () => {
  const newSessionMinutes = parseInt(sessionLengthInput.value, 10);
  if (!isNaN(newSessionMinutes) && newSessionMinutes >= 1) {
    timerDuration = newSessionMinutes * 60;
    localStorage.setItem('sessionLength', newSessionMinutes);
  }
  const newBreakMinutes = parseInt(breakLengthInput.value, 10);
  if (!isNaN(newBreakMinutes) && newBreakMinutes >= 1) {
    breakDuration = newBreakMinutes * 60;
    localStorage.setItem('breakLength', newBreakMinutes);
  }
  settingsMenu.style.display = "none";
});

/***** Initial Render *****/
renderTaskList();
drawWheel(rotationAngle);
