import * as THREE from 'three';
import { Character } from '../gameplay/Character';
import { TestDummy } from './TestDummy';

export class HitboxVisualizer {
  public isVisible: boolean = false;
  private wireframeGroup: THREE.Group;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.wireframeGroup = new THREE.Group();
    this.wireframeGroup.visible = false;
    this.scene.add(this.wireframeGroup);
  }

  public toggle(): boolean {
    this.isVisible = !this.isVisible;
    this.wireframeGroup.visible = this.isVisible;
    return this.isVisible;
  }

  public update(character: Character, dummies: TestDummy[]) {
    if (!this.isVisible) return;

    // Clear previous wireframe shapes
    while (this.wireframeGroup.children.length > 0) {
      this.wireframeGroup.remove(this.wireframeGroup.children[0]);
    }

    // Green Hurtbox around Character
    const charBox = new THREE.Box3().setFromObject(character.mesh);
    const charHelper = new THREE.Box3Helper(charBox, new THREE.Color(0x30d158));
    this.wireframeGroup.add(charHelper);

    // Red Swept-Hitbox for Greatsword swing
    if (character.currentAction === 'attack') {
      const activeWeapon = character.weaponSystem.getActiveWeaponData();
      const swingArcGeo = new THREE.RingGeometry(0.5, activeWeapon.range, 16, 1, -Math.PI * 0.35, Math.PI * 0.7);
      const swingArcMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        wireframe: true,
        side: THREE.DoubleSide
      });
      const swingArc = new THREE.Mesh(swingArcGeo, swingArcMat);
      swingArc.rotation.x = Math.PI * 0.5;
      swingArc.position.copy(character.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
      swingArc.rotation.y = character.mesh.rotation.y;
      this.wireframeGroup.add(swingArc);
    }

    // Yellow Hurtboxes for Dummies
    for (const dummy of dummies) {
      const dummyBox = new THREE.Box3().setFromObject(dummy.mesh);
      const dummyHelper = new THREE.Box3Helper(dummyBox, new THREE.Color(0xffd60a));
      this.wireframeGroup.add(dummyHelper);
    }
  }
}
