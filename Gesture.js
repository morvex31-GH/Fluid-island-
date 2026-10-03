const island = document.getElementById('island');
const resetBtn = document.getElementById('reset-btn');

// Configuration constants
const LONG_PRESS_DURATION = 350; // ms required to trigger expand
const SWIPE_THRESHOLD = 45;       // minimum pixels moved to register a dismiss swipe
const MOVEMENT_CANCEL_LIMIT = 8;  // max pixel wiggle allowed before canceling long-press

// Gesture state trackers
let pressTimer = null;
let startX = 0;
let startY = 0;
let isLongPressed = false;
let isDragging = false;

// Attach pointer events for cross-platform mouse & touch
island.addEventListener('pointerdown', onPointerDown);
island.addEventListener('pointermove', onPointerMove);
island.addEventListener('pointerup', onPointerUp);
island.addEventListener('pointercancel', onPointerCancel);

function onPointerDown(e) {
  // Capture pointer to receive move/up events even if the finger wanders outside
  island.setPointerCapture(e.pointerId);

  startX = e.clientX;
  startY = e.clientY;
  isLongPressed = false;
  isDragging = false;

  island.classList.add('holding');

  // Start the long-press countdown
  pressTimer = setTimeout(() => {
    isLongPressed = true;
    island.classList.remove('holding');
    expandIsland();
    
    // Trigger mobile haptic feedback if supported by the browser
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  }, LONG_PRESS_DURATION);
}

function onPointerMove(e) {
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  // If moved beyond the small jitter limit, it's a drag/swipe, not a steady press
  if (Math.hypot(deltaX, deltaY) > MOVEMENT_CANCEL_LIMIT) {
    clearTimeout(pressTimer);
    island.classList.remove('holding');
    isDragging = true;
  }

  // Interactive pull feedback during swipe
  if (isDragging) {
    // Dampen upward or horizontal movement for realistic tension
    const pullY = Math.min(0, deltaY * 0.4); 
    const pullX = deltaX * 0.25;
    island.style.transform = `translate(${pullX}px, ${pullY}px)`;
  }
}

function onPointerUp(e) {
  clearTimeout(pressTimer);
  island.classList.remove('holding');

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  // Reset interactive pull style
  island.style.transform = '';

  // 1. Check for Dismiss Gesture (Swipe Up or Sharp Swipe Left)
  if (deltaY < -SWIPE_THRESHOLD || deltaX < -SWIPE_THRESHOLD * 1.5) {
    dismissIsland();
    return;
  }

  // 2. Short Click/Tap Handling (When neither long-press nor swipe occurred)
  if (!isLongPressed && !isDragging) {
    handleTap();
  }
}

function onPointerCancel() {
  clearTimeout(pressTimer);
  island.classList.remove('holding');
  island.style.transform = '';
}

// State transition helpers
function expandIsland() {
  island.classList.remove('compact');
  island.classList.add('expanded');
}

function collapseIsland() {
  island.classList.remove('expanded');
  island.classList.add('compact');
}

function dismissIsland() {
  island.classList.add('dismissed');
}

function handleTap() {
  // Tapping while expanded collapses it back to compact
  if (island.classList.contains('expanded')) {
    collapseIsland();
  } else {
    // Quick bounce animation feedback on single tap
    island.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' }
    ], {
      duration: 250,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
  }
}

// Reset button to restore from dismissed state
resetBtn.addEventListener('click', () => {
  island.classList.remove('dismissed', 'expanded');
  island.classList.add('compact');
  island.style.transform = '';
});
