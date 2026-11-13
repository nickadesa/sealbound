// Dual Input System: PC Keyboard & Mouse + Mobile Touch HUD

export interface InputState {
  moveX: number; // -1 to 1 (A/D or Joystick X)
  moveZ: number; // -1 to 1 (W/S or Joystick Y)
  sprint: boolean;
  jump: boolean;
  attack: boolean;
  parry: boolean;
  swapWeapon: boolean;
  skill1: boolean;
  skill2: boolean;
  ultimate: boolean;
  interact: boolean; // Plant / Defuse (E)
  shoulderSwap: boolean; // V
  toggleEditor: boolean; // F2
  toggleHitbox: boolean; // F3
  pointerDeltaX: number;
  pointerDeltaY: number;
  isPointerLocked: boolean;
  isMobile: boolean;
}

export class InputManager {
  public state: InputState = {
    moveX: 0,
    moveZ: 0,
    sprint: false,
    jump: false,
    attack: false,
    parry: false,
    swapWeapon: false,
    skill1: false,
    skill2: false,
    ultimate: false,
    interact: false,
    shoulderSwap: false,
    toggleEditor: false,
    toggleHitbox: false,
    pointerDeltaX: 0,
    pointerDeltaY: 0,
    isPointerLocked: false,
    isMobile: false
  };

  private keys: Record<string, boolean> = {};
  private domElement: HTMLElement;

  // Touch tracking for mobile
  private joystickTouchId: number | null = null;
  private joystickOrigin = { x: 0, y: 0 };
  private aimTouchId: number | null = null;
  private lastAimPos = { x: 0, y: 0 };

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.state.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setupKeyboardMouse();
    this.setupTouch();
  }

  private setupKeyboardMouse() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyQ') this.state.swapWeapon = true;
      if (e.code === 'KeyV') this.state.shoulderSwap = true;
      if (e.code === 'KeyC') this.state.skill1 = true;
      if (e.code === 'KeyX') this.state.ultimate = true;
      if (e.code === 'F2') {
        e.preventDefault();
        this.state.toggleEditor = true;
      }
      if (e.code === 'F3') {
        e.preventDefault();
        this.state.toggleHitbox = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyQ') this.state.swapWeapon = false;
      if (e.code === 'KeyV') this.state.shoulderSwap = false;
      if (e.code === 'KeyC') this.state.skill1 = false;
      if (e.code === 'KeyX') this.state.ultimate = false;
      if (e.code === 'F2') this.state.toggleEditor = false;
      if (e.code === 'F3') this.state.toggleHitbox = false;
    });

    this.domElement.addEventListener('click', () => {
      if (!this.state.isMobile && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.state.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state.isPointerLocked) {
        this.state.pointerDeltaX += e.movementX;
        this.state.pointerDeltaY += e.movementY;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.state.attack = true;
      if (e.button === 2) this.state.parry = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.state.attack = false;
      if (e.button === 2) this.state.parry = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupTouch() {
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = touch.target as HTMLElement | null;

        // Ignore touches that began on interactive UI elements (buttons, shop modal, toolbar)
        if (target && target.closest('button, .tool-pill-btn, .touch-btn, .shop-modal-content, .editor-toolbar, input')) {
          continue;
        }

        // Left half of screen -> Virtual Joystick
        if (touch.clientX < window.innerWidth * 0.48 && this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          this.joystickOrigin = { x: touch.clientX, y: touch.clientY };
          this.updateJoystickUI(touch.clientX, touch.clientY, 0, 0, true);
        }
        // Right half of screen -> TPP Aim Look Swipe
        else if (touch.clientX >= window.innerWidth * 0.48 && this.aimTouchId === null) {
          this.aimTouchId = touch.identifier;
          this.lastAimPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          const dx = touch.clientX - this.joystickOrigin.x;
          const dy = touch.clientY - this.joystickOrigin.y;
          const dist = Math.hypot(dx, dy);
          const maxRadius = 45;
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);

          this.state.moveX = (clampedDist / maxRadius) * Math.cos(angle);
          this.state.moveZ = -(clampedDist / maxRadius) * Math.sin(angle); // Invert Y
          this.updateJoystickUI(this.joystickOrigin.x, this.joystickOrigin.y, dx, dy, true);
        } else if (touch.identifier === this.aimTouchId) {
          e.preventDefault();
          const dx = touch.clientX - this.lastAimPos.x;
          const dy = touch.clientY - this.lastAimPos.y;
          this.state.pointerDeltaX += dx * 2.2;
          this.state.pointerDeltaY += dy * 2.2;
          this.lastAimPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.state.moveX = 0;
          this.state.moveZ = 0;
          this.updateJoystickUI(0, 0, 0, 0, false);
        } else if (touch.identifier === this.aimTouchId) {
          this.aimTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }

  private updateJoystickUI(ox: number, oy: number, dx: number, dy: number, active: boolean) {
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!base || !knob) return;

    if (!active) {
      base.style.opacity = '0';
      return;
    }

    base.style.opacity = '1';
    base.style.left = `${ox}px`;
    base.style.top = `${oy}px`;

    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = clampedDist * Math.cos(angle);
    const ky = clampedDist * Math.sin(angle);

    knob.style.transform = `translate(${kx}px, ${ky}px)`;
  }

  public update() {
    // Read Keyboard WASD (if mobile joystick is not actively being dragged)
    if (this.joystickTouchId === null) {
      let x = 0;
      let z = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) z += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) z -= 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

      const len = Math.hypot(x, z);
      if (len > 0) {
        this.state.moveX = x / len;
        this.state.moveZ = z / len;
      } else {
        this.state.moveX = 0;
        this.state.moveZ = 0;
      }
    }

    this.state.sprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    this.state.jump = !!this.keys['Space'];
    if (this.keys['KeyE']) {
      this.state.interact = true;
    }
  }


  public consumePointerDelta(): { x: number; y: number } {
    const delta = { x: this.state.pointerDeltaX, y: this.state.pointerDeltaY };
    this.state.pointerDeltaX = 0;
    this.state.pointerDeltaY = 0;
    return delta;
  }
}
