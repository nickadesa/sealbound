import * as THREE from 'three';
import { sound } from '../engine/AudioSystem';
import mapData from '../data/defaultMap.json';

export interface SiteZone {
  id: string;
  name: string;
  position: THREE.Vector3;
  radius: number;
  color: string;
  altarMesh: THREE.Group;
  beaconBeam: THREE.Mesh;
}

export class SealObjective {
  public sites: SiteZone[] = [];
  public isPlanted: boolean = false;
  public plantedSiteId: string | null = null;
  public plantTimer: number = 0;
  public plantProgress: number = 0; // 0 to 1
  public defuseProgress: number = 0; // 0 to 1
  public isDefused: boolean = false;
  public detonationTimeRemaining: number = 45.0; // 45 seconds

  // Player state relative to site
  public isPlayerInsideSite: boolean = false;
  public activeSiteId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.createSiteMeshes(scene);
  }

  private createSiteMeshes(scene: THREE.Scene) {
    for (const siteCfg of mapData.sites) {
      const sitePos = new THREE.Vector3(siteCfg.position.x, siteCfg.position.y, siteCfg.position.z);
      const group = new THREE.Group();
      group.position.copy(sitePos);

      // Altar base platform
      const baseGeo = new THREE.CylinderGeometry(siteCfg.radius, siteCfg.radius * 1.05, 0.4, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x22262a,
        roughness: 0.6,
        metalness: 0.3
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.2;
      base.receiveShadow = true;
      group.add(base);

      // Glowing mystical circle boundary
      const ringGeo = new THREE.RingGeometry(siteCfg.radius - 0.2, siteCfg.radius, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: siteCfg.color,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.42;
      group.add(ring);

      // Central Shrine Stone Pedestal
      const pedGeo = new THREE.BoxGeometry(1.4, 1.2, 1.4);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x33383e, metalness: 0.5 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.8;
      ped.castShadow = true;
      group.add(ped);

      // Mystical Beacon Light Beam (vertical cylinder)
      const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 18, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: siteCfg.color,
        transparent: true,
        opacity: 0.45
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 9.8;
      group.add(beam);

      scene.add(group);

      this.sites.push({
        id: siteCfg.id,
        name: siteCfg.name,
        position: sitePos,
        radius: siteCfg.radius,
        color: siteCfg.color,
        altarMesh: group,
        beaconBeam: beam
      });
    }
  }

  public checkPlayerZone(playerPosition: THREE.Vector3) {
    this.isPlayerInsideSite = false;
    this.activeSiteId = null;

    for (const site of this.sites) {
      const dist = Math.hypot(
        playerPosition.x - site.position.x,
        playerPosition.z - site.position.z
      );

      if (dist <= site.radius) {
        this.isPlayerInsideSite = true;
        this.activeSiteId = site.id;
        break;
      }
    }
  }

  public updatePlanting(isHoldingInteract: boolean, deltaTime: number): boolean {
    if (!this.isPlayerInsideSite || this.isPlanted) {
      this.plantProgress = 0;
      return false;
    }

    if (isHoldingInteract) {
      this.plantProgress += deltaTime / 4.0; // 4.0 seconds to plant
      if (Math.random() < 0.1) sound.playSealPulse();

      if (this.plantProgress >= 1.0) {
        this.isPlanted = true;
        this.plantedSiteId = this.activeSiteId;
        this.plantProgress = 1.0;
        sound.playSealPulse();
        return true;
      }
    } else {
      this.plantProgress = Math.max(0, this.plantProgress - deltaTime * 2);
    }

    return false;
  }

  public updateDefusing(isHoldingInteract: boolean, deltaTime: number): boolean {
    if (!this.isPlanted || this.isDefused) {
      return false;
    }

    if (this.isPlayerInsideSite && this.activeSiteId === this.plantedSiteId && isHoldingInteract) {
      this.defuseProgress += deltaTime / 7.0; // 7.0 seconds to defuse
      if (Math.random() < 0.1) sound.playSealPulse();

      if (this.defuseProgress >= 1.0) {
        this.isDefused = true;
        this.defuseProgress = 1.0;
        sound.playSealPulse();
        return true;
      }
    } else {
      // Half-defuse milestone checkpoint at 50% (3.5s)!
      if (this.defuseProgress >= 0.5) {
        this.defuseProgress = Math.max(0.5, this.defuseProgress - deltaTime * 0.5);
      } else {
        this.defuseProgress = Math.max(0, this.defuseProgress - deltaTime * 0.5);
      }
    }

    return false;
  }

  public update(deltaTime: number) {
    if (this.isPlanted && !this.isDefused) {
      this.detonationTimeRemaining -= deltaTime;
      if (this.detonationTimeRemaining <= 0) {
        this.detonationTimeRemaining = 0;
      }
    }

    // Pulse beacon beams
    for (const site of this.sites) {
      const pulse = 0.35 + Math.sin(Date.now() * 0.003) * 0.15;
      (site.beaconBeam.material as THREE.MeshBasicMaterial).opacity = 
        site.id === this.plantedSiteId ? 0.75 : pulse;
    }
  }
}
