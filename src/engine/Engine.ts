import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { InputManager } from './InputManager';
import { Character } from '../gameplay/Character';
import { TestDummy } from '../creator/TestDummy';
import { WeaponSystem } from '../gameplay/WeaponSystem';
import { CombatManager } from '../gameplay/CombatManager';
import { SealObjective } from '../gameplay/SealObjective';
import { RoundEconomy } from '../gameplay/RoundEconomy';
import { LevelEditor } from '../creator/LevelEditor';
import { HitboxVisualizer } from '../creator/HitboxVisualizer';
import { UIManager } from '../ui/UIManager';
import mapData from '../data/defaultMap.json';

export class Engine {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraRig: CameraRig;
  public input: InputManager;
  public character: Character;
  public dummy: TestDummy;
  public combat: CombatManager;
  public objective: SealObjective;
  public economy: RoundEconomy;
  public editor: LevelEditor;
  public hitboxVisualizer: HitboxVisualizer;
  public ui: UIManager;

  private obstacles: THREE.Object3D[] = [];
  private lastTime: number = performance.now();
  private isRunning: boolean = true;

  constructor(container: HTMLElement) {
    // 1. Scene & Atmosphere (Stylized Cel-Shaded Sky Sanctuary)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a222c);
    this.scene.fog = new THREE.FogExp2(0x1a222c, 0.015);

    // 2. WebGL Renderer with Mobile DPR Clamping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0)); // DPR clamping for 60 FPS
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting (Directional Sun with Shadows + Ambient Sky)
    this.setupLighting();

    // 4. Core Systems
    this.cameraRig = new CameraRig();
    this.ui = new UIManager();
    this.input = new InputManager(this.renderer.domElement);
    this.character = new Character();
    this.scene.add(this.character.mesh);

    // Spawn character at Attacker spawn
    this.character.mesh.position.set(0, 0, 18);

    // Training Sandbox Dummy
    this.dummy = new TestDummy(0, 8);
    this.scene.add(this.dummy.mesh);

    // Gameplay Managers
    this.combat = new CombatManager();
    this.objective = new SealObjective(this.scene);
    this.economy = new RoundEconomy();
    this.editor = new LevelEditor(this.scene);
    this.hitboxVisualizer = new HitboxVisualizer(this.scene);


    // Build default map geometry
    this.buildMapGeometry();

    // Setup UI & Tool Callbacks
    this.setupEventHandlers();

    // Handle Window Resize
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraRig.handleResize();
    });

    // Start Main Loop
    this.animate();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xdde5ed, 0.75);
    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfff6ea, 1.4);
    sun.position.set(25, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
  }

  private buildMapGeometry() {
    // 1. Arena Ground (Stylized Stone Courtyard)
    const floorGeo = new THREE.PlaneGeometry(90, 100);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2d343c,
      roughness: 0.7,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Obstacles & Cover Props from defaultMap.json
    for (const prop of mapData.props) {
      let geo: THREE.BufferGeometry;
      let mat = new THREE.MeshStandardMaterial({
        color: prop.type === 'pillar' ? 0x4e5864 : prop.type === 'wall' ? 0x38414b : 0x6e5239,
        roughness: 0.5,
        metalness: 0.3
      });

      if (prop.type === 'pillar') {
        geo = new THREE.CylinderGeometry(prop.scale.x, prop.scale.z, prop.scale.y, 16);
      } else {
        geo = new THREE.BoxGeometry(prop.scale.x, prop.scale.y, prop.scale.z);
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(prop.position.x, prop.position.y, prop.position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.obstacles.push(mesh);
    }
  }

  private setupEventHandlers() {
    // Shop purchases
    this.ui.onBuyPrimary = () => {
      if (this.economy.buyPrimaryWeapon()) {
        this.character.weaponSystem.swapWeapon();
      }
    };

    this.ui.onBuyPerk = (perkId: string) => {
      this.economy.buyPerk(perkId);
    };

    // Editor & Debug toggles
    this.ui.onToggleEditor = () => {
      const active = this.editor.toggle();
      this.ui.setEditorMode(active);
    };

    this.ui.onToggleHitbox = () => {
      this.hitboxVisualizer.toggle();
    };

    // Mobile Touch callbacks
    this.ui.onTouchAttack = () => {
      if (this.character.triggerAttack()) {
        this.combat.processAttack(this.character, [this.dummy], this.cameraRig.camera);
      }
    };

    this.ui.onTouchSwap = () => {
      this.character.weaponSystem.swapWeapon();
    };

    this.ui.onTouchParry = () => {
      this.character.triggerParry();
    };

    this.ui.onTouchSkill1 = () => {
      if (this.character.triggerSkill1()) {
        this.combat.processAttack(this.character, [this.dummy], this.cameraRig.camera);
      }
    };

    this.ui.onTouchSkill2 = () => {
      this.character.triggerSkill2();
    };

    this.ui.onTouchUlt = () => {
      this.character.triggerAttack();
      this.combat.spawnFloatingDamage("CATACLYSM!", true, this.character.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)));
    };

    this.ui.onTouchPlantHold = (isHolding: boolean) => {
      this.input.state.interact = isHolding;
    };


    // Level Editor Prop placement buttons
    document.getElementById('btn-add-pillar')?.addEventListener('click', () => {
      this.editor.spawnProp('pillar', this.cameraRig.camera.position.clone().add(new THREE.Vector3(0, -2, -5)));
    });

    document.getElementById('btn-add-wall')?.addEventListener('click', () => {
      this.editor.spawnProp('wall', this.cameraRig.camera.position.clone().add(new THREE.Vector3(0, -2, -5)));
    });

    document.getElementById('btn-add-crate')?.addEventListener('click', () => {
      this.editor.spawnProp('crate', this.cameraRig.camera.position.clone().add(new THREE.Vector3(0, -2, -5)));
    });

    document.getElementById('btn-export-map')?.addEventListener('click', () => {
      const json = this.editor.exportMapJSON();
      console.log('Exported Map JSON:', json);
      alert('Map JSON Exported to Console (Check Developer Tools)');
    });
  }

  private animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Process Input
    this.input.update();
    const pointerDelta = this.input.consumePointerDelta();

    // Hotkey triggers
    if (this.input.state.toggleEditor) {
      const active = this.editor.toggle();
      this.ui.setEditorMode(active);
    }

    if (this.input.state.toggleHitbox) {
      this.hitboxVisualizer.toggle();
    }

    if (this.input.state.shoulderSwap) {
      this.cameraRig.toggleShoulder();
    }

    if (this.input.state.swapWeapon) {
      this.character.weaponSystem.swapWeapon();
    }

    // ADS
    this.cameraRig.isAimingDownSights = this.input.state.parry && this.character.weaponSystem.activeSlot === 'primary';

    // 2. Editor Mode vs Play Mode
    if (this.editor.isActive) {
      this.editor.updateFlycam(
        { x: this.input.state.moveX, z: this.input.state.moveZ },
        pointerDelta,
        deltaTime
      );
      this.cameraRig.camera.position.copy(this.editor.flycamPosition);
      this.cameraRig.camera.rotation.set(this.editor.flycamPitch, this.editor.flycamYaw, 0, 'YXZ');
    } else {
      // Combat attacks
      if (this.input.state.attack) {
        if (this.character.triggerAttack()) {
          this.combat.processAttack(this.character, [this.dummy], this.cameraRig.camera);
        }
      }

      if (this.input.state.parry && !this.cameraRig.isAimingDownSights) {
        this.character.triggerParry();
      }

      if (this.input.state.skill1) {
        if (this.character.triggerSkill1()) {
          this.combat.processAttack(this.character, [this.dummy], this.cameraRig.camera);
        }
      }

      if (this.input.state.skill2) {
        this.character.triggerSkill2();
      }

      // Update Character Locomotion
      this.character.update(
        deltaTime,
        {
          x: this.input.state.moveX,
          z: this.input.state.moveZ,
          sprint: this.input.state.sprint
        },
        this.cameraRig.yaw
      );

      // Update TPP Camera Rig
      this.cameraRig.update(
        this.character.mesh.position,
        pointerDelta,
        this.obstacles,
        deltaTime
      );
    }

    // 3. Update Gameplay Entities & Timers
    this.dummy.update(deltaTime);
    this.combat.update(deltaTime);
    this.objective.checkPlayerZone(this.character.mesh.position);

    // Update Plant / Defuse
    const isInteracting = this.input.state.interact;
    this.objective.updatePlanting(isInteracting, deltaTime);
    this.objective.updateDefusing(isInteracting, deltaTime);
    this.objective.update(deltaTime);

    this.economy.update(deltaTime);

    // 4. Update Hitbox Visualizer (F3)
    this.hitboxVisualizer.update(this.character, [this.dummy]);

    // 5. Update UI
    this.ui.update(this.character, this.economy, this.objective, this.combat);

    // 6. Render Frame
    this.renderer.render(this.scene, this.cameraRig.camera);
  };
}
