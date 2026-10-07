document.addEventListener('DOMContentLoaded', () => {
  // Timer State
  let defaultTime = 600; // 10 minutes default
  let totalSeconds = defaultTime;
  let remainingSeconds = defaultTime;
  let timerId = null;
  let isRunning = false;
  let isMuted = false;

  // Circle Math (Radius = 170)
  const CIRCUMFERENCE = 2 * Math.PI * 170;

  // DOM Elements
  const timeDisplay = document.getElementById('timeDisplay');
  const startStopBtn = document.getElementById('startStopBtn');
  const startStopText = document.getElementById('startStopText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const resetBtn = document.getElementById('resetBtn');
  const progressRing = document.getElementById('progressRing');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  // Sound Controls
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  
  // Fullscreen Controls
  const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
  const enterFullscreenIcon = document.getElementById('enterFullscreenIcon');
  const exitFullscreenIcon = document.getElementById('exitFullscreenIcon');

  // Presets & Adjusters
  const presetChips = document.querySelectorAll('.preset-chip');
  const decreaseTimeBtn = document.getElementById('decreaseTimeBtn');
  const increaseTimeBtn = document.getElementById('increaseTimeBtn');
  
  // Modal
  const completionModal = document.getElementById('completionModal');
  const dismissModalBtn = document.getElementById('dismissModalBtn');

  // Initialize Progress Ring
  progressRing.style.strokeDasharray = `${CIRCUMFERENCE}`;
  progressRing.style.strokeDashoffset = '0';

  // Format Seconds to MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Update Visual Displays
  function updateDisplay() {
    const formatted = formatTime(remainingSeconds);
    timeDisplay.textContent = formatted;
    
    // Update Document Title
    if (isRunning) {
      document.title = `(${formatted}) 10 Minutes Break`;
    } else {
      document.title = '10 Minutes Break - Desktop Timer';
    }

    // Update Progress Ring Offset
    const progress = remainingSeconds / totalSeconds;
    const offset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
    progressRing.style.strokeDashoffset = offset;
  }

  // Start / Pause Timer Logic
  function toggleTimer() {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    if (remainingSeconds <= 0) return;

    isRunning = true;
    startStopText.textContent = 'Pause';
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    statusDot.classList.add('active');
    statusText.textContent = 'BREAK IN PROGRESS';

    timerId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();

      if (remainingSeconds <= 0) {
        completeTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    timerId = null;
    startStopText.textContent = 'Resume';
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    statusDot.classList.remove('active');
    statusText.textContent = 'BREAK PAUSED';
    document.title = '10 Minutes Break - Paused';
  }

  function resetTimer() {
    pauseTimer();
    remainingSeconds = totalSeconds;
    startStopText.textContent = 'Start Break';
    statusText.textContent = 'READY FOR BREAK';
    updateDisplay();
  }

  // Completion Event
  function completeTimer() {
    pauseTimer();
    statusText.textContent = 'BREAK COMPLETE';
    completionModal.classList.remove('hidden');
    playCompletionChime();
  }

  // Web Audio API Chime
  function playCompletionChime() {
    if (isMuted) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.15 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.15);
        osc.stop(ctx.currentTime + index * 0.15 + 1.5);
      });
    } catch (e) {
      console.log('Audio playback standard fallback');
    }
  }

  // Fullscreen Toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Fullscreen Change Observer
  document.addEventListener('fullscreenchange', () => {
    const isFS = !!document.fullscreenElement;
    enterFullscreenIcon.classList.toggle('hidden', isFS);
    exitFullscreenIcon.classList.toggle('hidden', !isFS);
  });

  // Preset Handlers
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const selectedSeconds = parseInt(chip.getAttribute('data-time'), 10);
      totalSeconds = selectedSeconds;
      resetTimer();
    });
  });

  // Time Adjusters
  increaseTimeBtn.addEventListener('click', () => {
    totalSeconds += 60;
    remainingSeconds += 60;
    updateDisplay();
  });

  decreaseTimeBtn.addEventListener('click', () => {
    if (remainingSeconds > 60) {
      totalSeconds = Math.max(60, totalSeconds - 60);
      remainingSeconds -= 60;
      updateDisplay();
    }
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    soundOnIcon.classList.toggle('hidden', isMuted);
    soundOffIcon.classList.toggle('hidden', !isMuted);
  });

  // Fullscreen Button Event
  fullscreenToggleBtn.addEventListener('click', toggleFullscreen);

  // Modal Dismiss
  dismissModalBtn.addEventListener('click', () => {
    completionModal.classList.add('hidden');
    resetTimer();
  });

  // Main Buttons
  startStopBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleTimer();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      resetTimer();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      soundToggleBtn.click();
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Initial Render
  updateDisplay();
});