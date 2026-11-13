import { Icons } from './Icons';
import { Character } from '../gameplay/Character';
import { RoundEconomy } from '../gameplay/RoundEconomy';
import { SealObjective } from '../gameplay/SealObjective';
import { CombatManager } from '../gameplay/CombatManager';
import perksData from '../data/perks.json';

export class UIManager {
  private container: HTMLElement;
  private damageContainer: HTMLElement;
  public onBuyPerk?: (perkId: string) => void;
  public onBuyPrimary?: () => void;
  public onToggleEditor?: () => void;
  public onToggleHitbox?: () => void;

  // Touch button callbacks
  public onTouchAttack?: () => void;
  public onTouchSwap?: () => void;
  public onTouchParry?: () => void;
  public onTouchSkill1?: () => void;
  public onTouchSkill2?: () => void;
  public onTouchUlt?: () => void;
  public onTouchPlantHold?: (isHolding: boolean) => void;

  public isShopOpen: boolean = false;

  constructor() {
    this.container = document.getElementById('ui-root') || document.body;
    this.damageContainer = document.createElement('div');
    this.damageContainer.id = 'floating-damage-layer';
    document.body.appendChild(this.damageContainer);

    this.renderBaseUI();
    this.setupListeners();
  }

  private renderBaseUI() {
    this.container.innerHTML = `
      <!-- TOP NAV / MATCH STATUS (Apple / Fortnite Pill Bar) -->
      <header class="top-nav-bar">
        <div class="team-score defender-score">
          <span class="team-label">DEF</span>
          <span class="score-number" id="ui-def-score">0</span>
        </div>

        <div class="round-timer-pill">
          <span class="round-indicator" id="ui-round-label">ROUND 1</span>
          <span class="timer-display" id="ui-timer">01:40</span>
          <div class="site-status-badges">
            <span class="site-badge" id="badge-site-a">A</span>
            <span class="site-badge" id="badge-site-b">B</span>
          </div>
        </div>

        <div class="team-score attacker-score">
          <span class="score-number" id="ui-atk-score">0</span>
          <span class="team-label">ATK</span>
        </div>

        <!-- Gold & Mode Badges -->
        <div class="top-right-tools">
          <div class="gold-pill">
            <span class="icon-wrap">${Icons.coin}</span>
            <span id="ui-gold-amount">800 G</span>
          </div>

          <button id="btn-shop-toggle" class="tool-pill-btn">
            <span class="icon-wrap">${Icons.box}</span>
            <span>SHOP</span>
          </button>

          <button id="btn-editor-toggle" class="tool-pill-btn">
            <span class="icon-wrap">${Icons.hammer}</span>
            <span>EDITOR (F2)</span>
          </button>

          <button id="btn-hitbox-toggle" class="tool-pill-btn">
            <span class="icon-wrap">${Icons.eye}</span>
            <span>HITBOX (F3)</span>
          </button>
        </div>
      </header>

      <!-- RETICLE / TACTICAL CROSSHAIR -->
      <div class="tactical-crosshair" id="tactical-reticle">
        <div class="reticle-dot"></div>
        <div class="reticle-line reticle-top"></div>
        <div class="reticle-line reticle-bottom"></div>
        <div class="reticle-line reticle-left"></div>
        <div class="reticle-line reticle-right"></div>
      </div>

      <!-- OBJECTIVE PROMPT (HOLD TO PLANT/DEFUSE) -->
      <div class="objective-prompt-card" id="ui-objective-card">
        <div class="prompt-header">
          <span class="icon-wrap pulse-icon">${Icons.seal}</span>
          <span id="ui-objective-title">ANCIENT SEAL SITE A</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="ui-objective-progress"></div>
        </div>
        <span class="prompt-subtext" id="ui-objective-subtext">HOLD [E] TO PLANT SEAL</span>
      </div>

      <!-- DETONATION WARNING BANNER -->
      <div class="detonation-banner" id="ui-detonation-banner">
        <span class="detonation-pulse"></span>
        <span class="detonation-text" id="ui-detonation-text">SEAL ACTIVATION IN 45s</span>
      </div>

      <!-- BOTTOM HUD (HEALTH, WEAPON & SKILLS) -->
      <footer class="bottom-tactical-hud">
        <!-- Health & Shield -->
        <div class="vitals-panel">
          <div class="vital-row">
            <span class="vital-label">SHIELD</span>
            <div class="bar-track shield-track">
              <div class="bar-fill shield-fill" id="ui-shield-bar" style="width: 100%;"></div>
            </div>
            <span class="vital-value" id="ui-shield-text">50</span>
          </div>

          <div class="vital-row">
            <span class="vital-label">HEALTH</span>
            <div class="bar-track hp-track">
              <div class="bar-fill hp-fill" id="ui-hp-bar" style="width: 100%;"></div>
            </div>
            <span class="vital-value" id="ui-hp-text">100</span>
          </div>
        </div>

        <!-- Skills (Pure White Silhouette Vector Icons) -->
        <div class="skills-row">
          <div class="skill-circle-badge" id="skill-badge-1">
            <div class="skill-icon-inner">${Icons.cleave}</div>
            <span class="skill-hotkey">C</span>
            <div class="cooldown-overlay" id="skill-cd-1"></div>
          </div>

          <div class="skill-circle-badge" id="skill-badge-2">
            <div class="skill-icon-inner">${Icons.aegis}</div>
            <span class="skill-hotkey">E</span>
            <div class="cooldown-overlay" id="skill-cd-2"></div>
          </div>

          <div class="skill-circle-badge ultimate-badge" id="skill-badge-ult">
            <div class="skill-icon-inner">${Icons.cataclysm}</div>
            <span class="skill-hotkey">X</span>
            <div class="cooldown-overlay" id="skill-cd-ult"></div>
          </div>
        </div>

        <!-- Weapon Card & Quick Swap -->
        <div class="weapon-card-panel" id="ui-weapon-card">
          <div class="weapon-meta">
            <span class="weapon-slot-tag" id="ui-weapon-slot">PRIMARY</span>
            <span class="weapon-name" id="ui-weapon-name">CRIMSON GREATSWORD</span>
          </div>
          <div class="weapon-swap-btn" id="btn-weapon-swap">
            <span class="icon-wrap">${Icons.swap}</span>
            <span class="hotkey-hint">Q</span>
          </div>
        </div>
      </footer>

      <!-- MOBILE VIRTUAL TOUCH HUD LAYER (STRICTLY NO EMOJIS) -->
      <div id="touch-controls-layer" class="touch-hud-layer">
        <!-- Floating Joystick Base -->
        <div id="joystick-base" class="joystick-base">
          <div id="joystick-knob" class="joystick-knob"></div>
        </div>

        <!-- Action Buttons (Right Thumb) -->
        <div class="touch-actions-cluster">
          <button id="btn-touch-swap" class="touch-btn swap-touch-btn" aria-label="Swap Weapon">
            <span class="icon-wrap">${Icons.swap}</span>
            <span class="touch-label">SWAP</span>
          </button>

          <button id="btn-touch-parry" class="touch-btn parry-touch-btn" aria-label="Parry">
            <span class="icon-wrap">${Icons.shield}</span>
            <span class="touch-label">PARRY</span>
          </button>

          <button id="btn-touch-attack" class="touch-btn attack-touch-btn" aria-label="Attack">
            <span class="icon-wrap">${Icons.sword}</span>
            <span class="touch-label">SLASH</span>
          </button>
        </div>

        <!-- Mobile Skill Buttons -->
        <div class="touch-skills-cluster">
          <button id="btn-touch-skill1" class="touch-skill-btn">
            <span class="icon-wrap">${Icons.cleave}</span>
          </button>
          <button id="btn-touch-skill2" class="touch-skill-btn">
            <span class="icon-wrap">${Icons.aegis}</span>
          </button>
          <button id="btn-touch-ult" class="touch-skill-btn touch-ult-btn">
            <span class="icon-wrap">${Icons.cataclysm}</span>
          </button>
        </div>
      </div>

      <!-- BUY PHASE / PERKS SHOP MODAL (Fortnite / Apple Style) -->
      <div class="shop-modal-overlay" id="ui-shop-modal">
        <div class="shop-modal-content">
          <div class="shop-header">
            <div class="shop-title-wrap">
              <span class="shop-tag">TACTICAL ARSENAL & PERKS</span>
              <h2 class="shop-title">ROUND PREPARATION</h2>
            </div>
            <div class="shop-wallet">
              <span class="icon-wrap">${Icons.coin}</span>
              <span id="ui-shop-gold">800 G</span>
            </div>
            <button class="shop-close-btn" id="btn-shop-close">&times;</button>
          </div>

          <div class="shop-sections-grid">
            <!-- Primary Weapon Card -->
            <div class="shop-card primary-weapon-card" id="shop-primary-card">
              <div class="card-badge">SIGNATURE ARSENAL</div>
              <h3 class="card-title">Crimson-Vein Steel Greatsword</h3>
              <p class="card-desc">High-damage double-edged straight sword with central crimson energy vein.</p>
              <div class="card-stats">
                <span>Damage: 95</span>
                <span>Range: 2.8m</span>
              </div>
              <div class="card-price-row">
                <span class="price-val">2,200 G</span>
                <button class="pill-action-btn" id="btn-buy-primary">UNLOCK</button>
              </div>
            </div>

            <!-- Perks Catalog -->
            <div class="perks-catalog-wrap">
              <span class="section-label">AVAILABLE PERKS</span>
              <div class="perks-grid">
                ${perksData.map(perk => `
                  <div class="perk-item-card" data-perk-id="${perk.id}">
                    <div class="perk-info">
                      <span class="perk-category">${perk.category}</span>
                      <h4 class="perk-name">${perk.name}</h4>
                      <p class="perk-desc">${perk.description}</p>
                    </div>
                    <div class="perk-footer">
                      <span class="perk-cost">${perk.cost} G</span>
                      <button class="pill-action-btn btn-buy-perk" data-perk-id="${perk.id}">BUY</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- IN-BROWSER LEVEL EDITOR TOOLBAR (F2 MODE) -->
      <div class="editor-toolbar" id="ui-editor-toolbar">
        <div class="editor-header">
          <span class="icon-wrap">${Icons.hammer}</span>
          <span class="editor-title">MAP EDITOR (FLYCAM)</span>
        </div>
        <div class="editor-actions">
          <button class="editor-pill-btn" id="btn-add-pillar">ADD PILLAR</button>
          <button class="editor-pill-btn" id="btn-add-wall">ADD WALL</button>
          <button class="editor-pill-btn" id="btn-add-crate">ADD CRATE</button>
          <button class="editor-pill-btn export-btn" id="btn-export-map">EXPORT JSON</button>
        </div>
      </div>
    `;
  }

  private setupListeners() {
    // Shop toggle
    document.getElementById('btn-shop-toggle')?.addEventListener('click', () => this.toggleShop());
    document.getElementById('btn-shop-close')?.addEventListener('click', () => this.toggleShop(false));

    // Buy primary
    document.getElementById('btn-buy-primary')?.addEventListener('click', () => {
      this.onBuyPrimary?.();
    });

    // Buy perks
    this.container.querySelectorAll('.btn-buy-perk').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-perk-id');
        if (id) this.onBuyPerk?.(id);
      });
    });

    // Creator tools
    document.getElementById('btn-editor-toggle')?.addEventListener('click', () => {
      this.onToggleEditor?.();
    });

    document.getElementById('btn-hitbox-toggle')?.addEventListener('click', () => {
      this.onToggleHitbox?.();
    });

    document.getElementById('btn-weapon-swap')?.addEventListener('click', () => {
      this.onTouchSwap?.();
    });

    // Touch controls
    const attackBtn = document.getElementById('btn-touch-attack');
    attackBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchAttack?.();
    });

    const swapBtn = document.getElementById('btn-touch-swap');
    swapBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchSwap?.();
    });

    const parryBtn = document.getElementById('btn-touch-parry');
    parryBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchParry?.();
    });

    document.getElementById('btn-touch-skill1')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchSkill1?.();
    });

    document.getElementById('btn-touch-skill2')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchSkill2?.();
    });

    document.getElementById('btn-touch-ult')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onTouchUlt?.();
    });
  }

  public toggleShop(forceState?: boolean) {
    this.isShopOpen = forceState !== undefined ? forceState : !this.isShopOpen;
    const modal = document.getElementById('ui-shop-modal');
    if (modal) {
      modal.classList.toggle('active', this.isShopOpen);
    }
  }

  public update(
    char: Character,
    econ: RoundEconomy,
    objective: SealObjective,
    combat: CombatManager
  ) {
    // Vitals
    const hpText = document.getElementById('ui-hp-text');
    const hpBar = document.getElementById('ui-hp-bar');
    if (hpText && hpBar) {
      hpText.textContent = char.hp.toString();
      hpBar.style.width = `${char.hp}%`;
    }

    const shieldText = document.getElementById('ui-shield-text');
    const shieldBar = document.getElementById('ui-shield-bar');
    if (shieldText && shieldBar) {
      shieldText.textContent = char.shield.toString();
      shieldBar.style.width = `${(char.shield / 50) * 100}%`;
    }

    // Match status
    const roundLabel = document.getElementById('ui-round-label');
    if (roundLabel) {
      roundLabel.textContent = `ROUND ${econ.currentRound}`;
    }

    const timer = document.getElementById('ui-timer');
    if (timer) {
      const t = econ.isBuyPhase ? econ.buyPhaseTimeRemaining : econ.roundTimeRemaining;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60).toString().padStart(2, '0');
      timer.textContent = `${econ.isBuyPhase ? 'BUY ' : ''}${mins}:${secs}`;
    }

    const defScore = document.getElementById('ui-def-score');
    const atkScore = document.getElementById('ui-atk-score');
    if (defScore) defScore.textContent = econ.defenderScore.toString();
    if (atkScore) atkScore.textContent = econ.attackerScore.toString();

    // Gold
    const goldText = document.getElementById('ui-gold-amount');
    const shopGold = document.getElementById('ui-shop-gold');
    if (goldText) goldText.textContent = `${econ.gold} G`;
    if (shopGold) shopGold.textContent = `${econ.gold} G`;

    // Weapon slot & name
    const weaponSlot = document.getElementById('ui-weapon-slot');
    const weaponName = document.getElementById('ui-weapon-name');
    const activeData = char.weaponSystem.getActiveWeaponData();
    if (weaponSlot) weaponSlot.textContent = char.weaponSystem.activeSlot.toUpperCase();
    if (weaponName) weaponName.textContent = activeData.name.toUpperCase();

    // Objective Prompt
    const objCard = document.getElementById('ui-objective-card');
    const objBar = document.getElementById('ui-objective-progress');
    const objText = document.getElementById('ui-objective-subtext');

    if (objCard && objBar && objText) {
      if (objective.isPlayerInsideSite) {
        objCard.classList.add('visible');
        if (!objective.isPlanted) {
          objText.textContent = `HOLD [E] TO PLANT SEAL (${objective.activeSiteId})`;
          objBar.style.width = `${objective.plantProgress * 100}%`;
          objBar.style.background = '#00f0ff';
        } else if (!objective.isDefused && objective.activeSiteId === objective.plantedSiteId) {
          objText.textContent = `HOLD [E] TO DISPEL SEAL (${objective.activeSiteId})`;
          objBar.style.width = `${objective.defuseProgress * 100}%`;
          objBar.style.background = '#ffaa00';
        }
      } else {
        objCard.classList.remove('visible');
      }
    }

    // Detonation Banner
    const banner = document.getElementById('ui-detonation-banner');
    const detText = document.getElementById('ui-detonation-text');
    if (banner && detText) {
      if (objective.isPlanted && !objective.isDefused) {
        banner.classList.add('visible');
        detText.textContent = `SEAL SITE ${objective.plantedSiteId} DETONATES IN ${Math.ceil(objective.detonationTimeRemaining)}s`;
      } else {
        banner.classList.remove('visible');
      }
    }

    // Site Badges
    const badgeA = document.getElementById('badge-site-a');
    const badgeB = document.getElementById('badge-site-b');
    if (badgeA && badgeB) {
      badgeA.classList.toggle('planted', objective.plantedSiteId === 'A');
      badgeB.classList.toggle('planted', objective.plantedSiteId === 'B');
    }

    // Shop primary button state
    const btnBuyPrimary = document.getElementById('btn-buy-primary');
    if (btnBuyPrimary) {
      if (econ.primaryWeaponUnlocked) {
        btnBuyPrimary.textContent = 'EQUIPPED';
        btnBuyPrimary.setAttribute('disabled', 'true');
      } else if (econ.currentRound === 1) {
        btnBuyPrimary.textContent = 'LOCKED (ROUND 1)';
        btnBuyPrimary.setAttribute('disabled', 'true');
      } else if (econ.gold < 2200) {
        btnBuyPrimary.textContent = '2,200 G NEEDED';
        btnBuyPrimary.setAttribute('disabled', 'true');
      } else {
        btnBuyPrimary.textContent = 'BUY (2,200 G)';
        btnBuyPrimary.removeAttribute('disabled');
      }
    }

    // Floating combat text rendering
    this.renderFloatingDamage(combat);
  }

  private renderFloatingDamage(combat: CombatManager) {
    this.damageContainer.innerHTML = '';
    for (const dmg of combat.floatingDamages) {
      const el = document.createElement('div');
      el.className = `floating-dmg ${dmg.isHeadshot ? 'headshot' : 'body'}`;
      el.textContent = dmg.isHeadshot ? `CRIT ${dmg.text}` : dmg.text;
      el.style.left = `calc(50% + ${dmg.position.x * 20}px)`;
      el.style.top = `calc(50% - ${dmg.position.y * 30}px)`;
      el.style.opacity = dmg.life.toString();
      this.damageContainer.appendChild(el);
    }
  }

  public setEditorMode(active: boolean) {
    const toolbar = document.getElementById('ui-editor-toolbar');
    const reticle = document.getElementById('tactical-reticle');
    if (toolbar) toolbar.classList.toggle('visible', active);
    if (reticle) reticle.style.display = active ? 'none' : 'block';
  }
}
