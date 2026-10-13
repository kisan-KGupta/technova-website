/* ==========================================================================
   TechNova Solutions — Interactive Promotional Website Engine
   High-Fidelity 3D Simulation Preview, Dark/Light Theme & Lead Engine
   ========================================================================== */

let update3DTheme = null;

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  init3DHeroCanvas();
  initPromotionalVideo();
  initLeadForm();
  initNavbarScroll();
  initLazySectionAnimations();
  initCaseStudyInteractiveHUD();
});

/* ==========================================================================
   1. Dark / Light Theme Toggle System
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  
  // Retrieve saved theme or system preference
  const savedTheme = localStorage.getItem('technova_theme');
  const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');

  applyTheme(initialTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('technova_theme', nextTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const logoImgs = document.querySelectorAll('.brand-logo-img');
  logoImgs.forEach((img) => {
    img.src = theme === 'light' ? 'technova-logo-light.svg' : 'technova-logo-dark.svg';
  });
  if (typeof update3DTheme === 'function') {
    update3DTheme(theme);
  }
}

/* ==========================================================================
   2. Interactive Three.js 3D Simulation Canvas (Instanced & Optimized)
   ========================================================================== */
function init3DHeroCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') {
    console.warn('Three.js or canvas-container not ready.');
    return;
  }

  let isInitialized = false;
  let isCanvasVisible = false;
  let animFrameId = null;

  let scene, camera, renderer, clock, warehouseGroup, envContainerGroup, hazardLight, ringMat, hazardRing, avatarGroup;
  let currentEnvPreset = 'storage';

  // 360° Camera Navigation & Collision Constraints
  let cameraYaw = 0.4;
  let cameraPitch = 0.48; // ~27.5 degrees elevation
  let cameraRadius = 13.5;
  const minRadius = 4.5;
  const maxRadius = 18.0;
  const minPitch = 0.12; // Prevent clipping top-down
  const maxPitch = Math.PI / 2 - 0.04; // ~87.7 deg: Prevent camera clipping under floor

  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;

  // GPU Memory Cleanup Utility
  function disposeMaterial(mat) {
    if (!mat) return;
    mat.dispose();
    if (mat.map) mat.map.dispose();
    if (mat.bumpMap) mat.bumpMap.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
  }

  function disposeThreeResources(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.isMesh || child.isInstancedMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(child.material);
          }
        }
      }
    });
    while (obj.children.length > 0) {
      obj.remove(obj.children[0]);
    }
  }

  // Normalized InstancedMesh Geometry Builder for Repeated Objects
  function buildInstancedWarehouseEnvironment(envType) {
    if (!envContainerGroup) return;
    disposeThreeResources(envContainerGroup);

    const dummy = new THREE.Object3D();

    // Shared Standard Materials
    const rackSteelMat = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, metalness: 0.7, roughness: 0.3 });
    const woodPalletMat = new THREE.MeshStandardMaterial({ color: 0x854D0E, roughness: 0.8 });
    const crateAmberMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.6 });
    const crateBlueMat  = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4 });
    const crateGreenMat = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.4 });

    // Shared Base Geometries (Normalized Metrics in Meters)
    const postGeo = new THREE.BoxGeometry(0.12, 4.8, 0.12);
    const beamGeo = new THREE.BoxGeometry(3.3, 0.1, 0.1);
    const palletGeo = new THREE.BoxGeometry(3.1, 0.08, 1.1);
    const crateGeo = new THREE.BoxGeometry(0.85, 0.75, 0.85);

    // Layout configuration per environment type
    let rackLayout = [];
    if (envType === 'storage') {
      rackLayout = [
        { x: -3.8, z: -2.5 }, { x: -3.8, z: 2.5 },
        { x: 3.8, z: -2.5 },  { x: 3.8, z: 2.5 }
      ];
    } else if (envType === 'hazard') {
      rackLayout = [
        { x: -3.8, z: -2.5 }, { x: 3.8, z: 2.5 }
      ];
    } else { // 'staging'
      rackLayout = [
        { x: -4.2, z: -1.5 }, { x: -4.2, z: 3.0 }
      ];
    }

    const rackCount = rackLayout.length;
    const postsPerRack = 4;
    const beamsPerRack = 6;
    const palletsPerRack = 3;
    const cratesPerRack = 6;

    const totalPosts = rackCount * postsPerRack;
    const totalBeams = rackCount * beamsPerRack;
    const totalPallets = rackCount * palletsPerRack;
    const totalCrates = rackCount * cratesPerRack;

    // InstancedMeshes with Frustum Culling Enabled
    const instancedPosts = new THREE.InstancedMesh(postGeo, rackSteelMat, totalPosts);
    const instancedBeams = new THREE.InstancedMesh(beamGeo, rackSteelMat, totalBeams);
    const instancedPallets = new THREE.InstancedMesh(palletGeo, woodPalletMat, totalPallets);
    const instancedCratesA = new THREE.InstancedMesh(crateGeo, crateAmberMat, Math.ceil(totalCrates / 3));
    const instancedCratesB = new THREE.InstancedMesh(crateGeo, crateBlueMat, Math.ceil(totalCrates / 3));
    const instancedCratesC = new THREE.InstancedMesh(crateGeo, crateGreenMat, Math.ceil(totalCrates / 3));

    [instancedPosts, instancedBeams, instancedPallets, instancedCratesA, instancedCratesB, instancedCratesC].forEach(m => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = true; // High performance Frustum Culling
    });

    let postIdx = 0, beamIdx = 0, palletIdx = 0, crateAIdx = 0, crateBIdx = 0, crateCIdx = 0;

    rackLayout.forEach(r => {
      // 1. Posts
      for (let dx of [-1.6, 1.6]) {
        for (let dz of [-0.6, 0.6]) {
          dummy.position.set(r.x + dx, 2.4, r.z + dz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          instancedPosts.setMatrixAt(postIdx++, dummy.matrix);
        }
      }

      // 2. Shelves & Pallets & Cargo Crates
      const levels = [0.8, 2.2, 3.6];
      levels.forEach((y, lvlIdx) => {
        // Front & Back Beams
        dummy.position.set(r.x, y, r.z + 0.6);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        instancedBeams.setMatrixAt(beamIdx++, dummy.matrix);

        dummy.position.set(r.x, y, r.z - 0.6);
        dummy.updateMatrix();
        instancedBeams.setMatrixAt(beamIdx++, dummy.matrix);

        // Pallet
        dummy.position.set(r.x, y + 0.05, r.z);
        dummy.updateMatrix();
        instancedPallets.setMatrixAt(palletIdx++, dummy.matrix);

        // Crates on shelf
        for (let bx of [-0.8, 0.8]) {
          dummy.position.set(r.x + bx, y + 0.45, r.z);
          dummy.updateMatrix();
          if (lvlIdx === 0 && crateAIdx < instancedCratesA.count) {
            instancedCratesA.setMatrixAt(crateAIdx++, dummy.matrix);
          } else if (lvlIdx === 1 && crateBIdx < instancedCratesB.count) {
            instancedCratesB.setMatrixAt(crateBIdx++, dummy.matrix);
          } else if (crateCIdx < instancedCratesC.count) {
            instancedCratesC.setMatrixAt(crateCIdx++, dummy.matrix);
          }
        }
      });
    });

    [instancedPosts, instancedBeams, instancedPallets, instancedCratesA, instancedCratesB, instancedCratesC].forEach(m => {
      m.instanceMatrix.needsUpdate = true;
      envContainerGroup.add(m);
    });

    // Environment-specific hazard props
    if (envType === 'hazard') {
      const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 24);
      const drumMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.3, metalness: 0.5 });
      const drum = new THREE.Mesh(drumGeo, drumMat);
      drum.position.set(-1.8, 0.55, 0);
      drum.castShadow = true;
      drum.frustumCulled = true;
      envContainerGroup.add(drum);

      const stripeGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.2, 24);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });
      const drumStripe = new THREE.Mesh(stripeGeo, stripeMat);
      drumStripe.position.set(-1.8, 0.55, 0);
      drumStripe.frustumCulled = true;
      envContainerGroup.add(drumStripe);
    }
  }

  function buildThreeScene() {
    if (isInitialized) return;
    isInitialized = true;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 360;

    // Scene & Camera
    scene = new THREE.Scene();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    scene.background = new THREE.Color(currentTheme === 'light' ? 0xE8F0E4 : 0x061417);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    updateCameraTransform();

    // Renderer with hardware optimization
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Industrial Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xF7F4D5, currentTheme === 'light' ? 1.5 : 1.2);
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(0xFFFFFF, currentTheme === 'light' ? 2.0 : 1.8);
    mainDirLight.position.set(10, 18, 10);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 1024;
    mainDirLight.shadow.mapSize.height = 1024;
    scene.add(mainDirLight);

    const cyanRimLight = new THREE.PointLight(0x839958, 3, 20);
    cyanRimLight.position.set(-6, 8, -6);
    scene.add(cyanRimLight);

    hazardLight = new THREE.PointLight(0xF59E0B, 4, 12);
    hazardLight.position.set(-1.8, 2.5, 0);
    scene.add(hazardLight);

    // Root Warehouse World Group
    warehouseGroup = new THREE.Group();
    scene.add(warehouseGroup);

    // Floor Grid & Epoxy Ground
    const gridHelper = new THREE.GridHelper(24, 24, 0x839958, currentTheme === 'light' ? 0xB5CBB0 : 0x1A424D);
    gridHelper.position.y = 0.01;
    gridHelper.frustumCulled = true;
    warehouseGroup.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(26, 26);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: currentTheme === 'light' ? 0xDCE8D8 : 0x0A242B, 
      roughness: 0.6,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.frustumCulled = true;
    warehouseGroup.add(floor);

    // Theme update hook
    update3DTheme = (newTheme) => {
      if (newTheme === 'light') {
        scene.background.setHex(0xE8F0E4);
        floorMat.color.setHex(0xDCE8D8);
        ambientLight.intensity = 1.5;
      } else {
        scene.background.setHex(0x061417);
        floorMat.color.setHex(0x0A242B);
        ambientLight.intensity = 1.2;
      }
    };

    // Safety Zone Striping
    const safetyStripeGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const safetyStripeMat = new THREE.MeshStandardMaterial({ color: 0xEAB308, roughness: 0.5, metalness: 0.1 });
    const safetyZone = new THREE.Mesh(safetyStripeGeo, safetyStripeMat);
    safetyZone.rotation.x = -Math.PI / 2;
    safetyZone.position.set(-1.8, 0.02, 0);
    safetyZone.receiveShadow = true;
    warehouseGroup.add(safetyZone);

    // Container for Environment Presets
    envContainerGroup = new THREE.Group();
    warehouseGroup.add(envContainerGroup);

    buildInstancedWarehouseEnvironment(currentEnvPreset);

    // Pulsing Holographic Ring
    const ringGeo = new THREE.RingGeometry(0.9, 1.3, 32);
    ringMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    hazardRing = new THREE.Mesh(ringGeo, ringMat);
    hazardRing.rotation.x = -Math.PI / 2;
    hazardRing.position.set(-1.8, 0.05, 0);
    warehouseGroup.add(hazardRing);

    // Safety Inspector Avatar Marker
    avatarGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x839958, roughness: 0.3, metalness: 0.2 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.2 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.2 });

    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 1.2, 16), bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    avatarGroup.add(bodyMesh);

    const vestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.6, 16), vestMat);
    vestMesh.position.y = 0.95;
    avatarGroup.add(vestMesh);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xF7F4D5 }));
    headMesh.position.y = 1.55;
    avatarGroup.add(headMesh);

    const helmetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
    helmetMesh.position.y = 1.6;
    avatarGroup.add(helmetMesh);

    avatarGroup.position.set(1.2, 0, 0.6);
    warehouseGroup.add(avatarGroup);

    // Pointer / Touch Navigation Listeners
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => { isDragging = false; });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      cameraYaw += deltaX * 0.005;
      cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch - deltaY * 0.004));
      updateCameraTransform();
    });

    // Wheel Zoom Navigation with Radius Bounds Clamping
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      cameraRadius = Math.max(minRadius, Math.min(maxRadius, cameraRadius + e.deltaY * 0.012));
      updateCameraTransform();
    }, { passive: false });

    // Environment Preset UI Chips Handler
    const envButtons = document.querySelectorAll('.env-chip-btn');
    envButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const envKey = e.target.getAttribute('data-env');
        if (envKey && envKey !== currentEnvPreset) {
          currentEnvPreset = envKey;
          envButtons.forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');

          buildInstancedWarehouseEnvironment(currentEnvPreset);

          const alertText = document.querySelector('#hazard-demo-alert span:last-child');
          if (alertText) {
            if (envKey === 'storage') alertText.textContent = 'Active Scenario: Instanced High-Bay Inspection';
            else if (envKey === 'hazard') alertText.textContent = 'Active Scenario: Chemical Spill & Warning Ring';
            else alertText.textContent = 'Active Scenario: Staging Hub & Forklift Clearance';
          }
        }
      });
    });

    clock = new THREE.Clock();

    // Resize Handler
    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0 && camera && renderer) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
  }

  // 360° Camera Positioning & Wall Bounds Clamping
  function updateCameraTransform() {
    if (!camera) return;
    const targetY = 1.2;

    let cx = cameraRadius * Math.sin(cameraPitch) * Math.sin(cameraYaw);
    let cy = targetY + cameraRadius * Math.cos(cameraPitch);
    let cz = cameraRadius * Math.sin(cameraPitch) * Math.cos(cameraYaw);

    // Wall & Object Clipping Prevention Bounds Clamping
    cx = Math.max(-10.5, Math.min(10.5, cx));
    cy = Math.max(0.6, Math.min(12.0, cy));
    cz = Math.max(-10.5, Math.min(10.5, cz));

    camera.position.set(cx, cy, cz);
    camera.lookAt(0, targetY, 0);
  }

  function renderLoop() {
    if (!isCanvasVisible) return;
    animFrameId = requestAnimationFrame(renderLoop);

    if (clock && warehouseGroup && renderer && scene && camera) {
      const elapsedTime = clock.getElapsedTime();

      if (!isDragging) {
        cameraYaw += 0.0015; // Gentle 360° observational spin
        updateCameraTransform();
      }

      // Hazard light & ring pulse effect
      const pulse = Math.sin(elapsedTime * 4.5) * 0.5 + 0.5;
      if (hazardLight) hazardLight.intensity = 2.5 + pulse * 3.5;
      if (ringMat) ringMat.opacity = 0.4 + pulse * 0.5;
      if (hazardRing) hazardRing.scale.set(1 + pulse * 0.2, 1 + pulse * 0.2, 1);

      // Subtle Inspector idle breathing animation
      if (avatarGroup) avatarGroup.position.y = Math.sin(elapsedTime * 2) * 0.03;

      renderer.render(scene, camera);
    }
  }

  // IntersectionObserver for Lazy Loading 3D Canvas & Pausing Offscreen Render
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isInitialized) {
            buildThreeScene();
          }
          isCanvasVisible = true;
          if (!animFrameId) {
            renderLoop();
          }
        } else {
          isCanvasVisible = false;
          if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
          }
        }
      });
    }, { threshold: 0.1 });

    observer.observe(container);
  } else {
    buildThreeScene();
    isCanvasVisible = true;
    renderLoop();
  }
}

/* ==========================================================================
   2b. Promotional Video Player Controls & Scroll Autoplay Engine
   ========================================================================== */
function initPromotionalVideo() {
  const video = document.getElementById('promo-video');
  const errorFallback = document.getElementById('video-error-fallback');
  const chapterBtns = document.querySelectorAll('.chapter-chip-btn');
  const audioToggleBtn = document.getElementById('btn-toggle-audio');
  const audioLabel = document.getElementById('audio-label');
  const audioIcon = document.getElementById('audio-icon');

  if (!video) return;

  // Ensure muted by default for cross-browser autoplay compliance
  video.muted = true;

  // 1. Automatic playback on scroll into viewport
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('Scroll autoplay deferred pending user interaction:', err);
            });
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, { threshold: 0.35 });

    videoObserver.observe(video);
  }

  // 2. Audio Mute/Unmute quick toggle control
  function updateAudioUI() {
    if (!audioLabel || !audioIcon) return;
    if (video.muted) {
      audioLabel.textContent = 'Sound Muted';
      audioIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else {
      audioLabel.textContent = 'Sound On';
      audioIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      updateAudioUI();
    });
    video.addEventListener('volumechange', updateAudioUI);
  }

  // 3. Graceful error fallback
  video.addEventListener('error', () => {
    if (errorFallback) {
      errorFallback.classList.remove('hidden');
    }
  });

  // 4. Chapter navigation buttons
  chapterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const time = parseFloat(btn.getAttribute('data-time') || '0');
      if (!isNaN(time)) {
        video.currentTime = time;
        video.play().catch(err => {
          console.log('Playback notice on chapter jump:', err);
        });
        video.focus();
      }
    });
  });
}

/* ==========================================================================
   3. B2B Lead Form Handler (Compliant Email-Based Contact Alternative)
   ========================================================================== */
function initLeadForm() {
  const form = document.getElementById('b2b-lead-form');
  const feedback = document.getElementById('form-feedback');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const company = document.getElementById('client-company').value.trim();
    const industrySelect = document.getElementById('client-industry');
    const industry = industrySelect ? industrySelect.options[industrySelect.selectedIndex].text : 'General';
    const message = document.getElementById('client-message').value.trim();

    // Required configuration item: verified institutional team email address
    const recipientConfig = 'student-team@sunderland.ac.uk';
    const subject = encodeURIComponent(`[TechNova Consultation Enquiry] ${company} - ${name}`);
    const bodyText = `Full Name: ${name}
Work Email: ${email}
Company: ${company}
Industry Sector: ${industry}

Project Scope & Training Objectives:
${message || 'Requesting a tailored 3D simulation demonstration and consultation.'}`;

    const mailtoUrl = `mailto:${recipientConfig}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

    // Trigger local email client
    try {
      window.location.href = mailtoUrl;
    } catch (err) {
      console.log('Mail client dispatch invoked');
    }

    // Display transparent, non-misleading confirmation with full text and copy utility
    feedback.className = 'form-feedback info';
    feedback.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong style="color: var(--text-heading); font-size: 1rem;">Consultation Enquiry Draft Generated</strong>
      </div>
      <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 10px;">
        In accordance with University of Sunderland CET257 assessment guidelines, enquiries are dispatched via authenticated email rather than simulated unverified server storage. Your default email client has been prompted.
      </p>
      <div class="enquiry-summary-box" id="enquiry-draft-text">${escapeHtml(bodyText)}</div>
      <div class="feedback-actions">
        <button type="button" class="btn btn-secondary btn-small" id="btn-copy-draft">
          Copy Enquiry to Clipboard
        </button>
        <a href="${mailtoUrl}" class="btn btn-primary btn-small">
          Open in Mail Client
        </a>
      </div>
      <div class="config-warning-pill">
        Required Deployment Item: Recipient email must be set to verified module team address prior to live launch.
      </div>
    `;
    feedback.classList.remove('hidden');

    const copyBtn = document.getElementById('btn-copy-draft');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(bodyText).then(() => {
            copyBtn.textContent = 'Copied to Clipboard';
            setTimeout(() => {
              copyBtn.textContent = 'Copy Enquiry to Clipboard';
            }, 3000);
          }).catch(() => {
            copyBtn.textContent = 'Please select text above to copy';
          });
        }
      });
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ==========================================================================
   4. Navbar Scroll Shadow & Active State
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   5. Lazy Section Scroll Reveal Animations
   ========================================================================== */
function initLazySectionAnimations() {
  const targets = document.querySelectorAll(
    '.service-card, .case-study-container, .paradigm-card, .about-mission-card, .team-card, .contact-wrapper'
  );

  if (!targets.length) return;

  targets.forEach(el => el.classList.add('lazy-reveal'));

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(el => sectionObserver.observe(el));
  } else {
    targets.forEach(el => el.classList.add('revealed'));
  }
}

/* ==========================================================================
   6. Interactive Case Study Cognitive Decision HUD Engine
   ========================================================================== */
function initCaseStudyInteractiveHUD() {
  const btnSafe = document.getElementById('btn-choice-safe');
  const btnUnsafe = document.getElementById('btn-choice-unsafe');
  const btnReset = document.getElementById('btn-choice-reset');
  const speakerEl = document.getElementById('hud-speaker');
  const dialogueEl = document.getElementById('hud-dialogue');
  const telemetryEl = document.getElementById('hud-telemetry');
  const telemetryText = document.getElementById('hud-telemetry-text');
  const scoreEl = document.getElementById('hud-score');
  const timerEl = document.getElementById('hud-timer');

  if (!btnSafe || !btnUnsafe) return;

  let sessionScore = 0;
  let timerSeconds = 84;

  // Live timer tick
  if (timerEl) {
    setInterval(() => {
      timerSeconds++;
      const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');
      timerEl.textContent = `TIME: ${m}:${s}`;
    }, 1000);
  }

  // Safe Choice (Push Back against Supervisor Dave)
  btnSafe.addEventListener('click', () => {
    sessionScore = 5;
    if (scoreEl) scoreEl.textContent = sessionScore;

    if (speakerEl) speakerEl.textContent = 'Supervisor Dave (Authority Overridden):';
    if (dialogueEl) {
      dialogueEl.innerHTML = '"Fair point, mate. Can\'t argue with HASAW 1974 Section 2. Grab the hazard cones from Bay 4 and get the spill kit out."';
    }

    if (telemetryEl && telemetryText) {
      telemetryEl.className = 'hud-telemetry-box success';
      telemetryText.innerHTML = '<strong>Assertiveness Benchmark Met (+5 PTS):</strong> Frontline trainee successfully challenged supervisor authority pressure. Behavioral assertion event logged.';
    }

    btnSafe.style.display = 'none';
    btnUnsafe.style.display = 'none';
    if (btnReset) btnReset.style.display = 'flex';
  });

  // Unsafe Choice (Agree with Dave)
  btnUnsafe.addEventListener('click', () => {
    sessionScore = -3;
    if (scoreEl) scoreEl.textContent = sessionScore;

    if (speakerEl) speakerEl.textContent = 'Supervisor Dave (Dismissive):';
    if (dialogueEl) {
      dialogueEl.innerHTML = '"Good lad. Knew you were sensible. Leeds dispatch leaves in twenty—let\'s keep moving, night shift can mop it."';
    }

    if (telemetryEl && telemetryText) {
      telemetryEl.className = 'hud-telemetry-box penalty';
      telemetryText.innerHTML = '<strong>Risk Normalization Detected (-3 PTS):</strong> High-bay slip hazard left unflagged due to authority deference. Safety compliance failure.';
    }

    btnSafe.style.display = 'none';
    btnUnsafe.style.display = 'none';
    if (btnReset) btnReset.style.display = 'flex';
  });

  // Reset Scenario
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      sessionScore = 0;
      if (scoreEl) scoreEl.textContent = sessionScore;

      if (speakerEl) speakerEl.textContent = 'Supervisor Dave (12y Veteran):';
      if (dialogueEl) {
        dialogueEl.innerHTML = '"Ah, don\'t worry about that small puddle. The night shift will mop it up. Let\'s keep moving!"';
      }

      if (telemetryEl && telemetryText) {
        telemetryEl.className = 'hud-telemetry-box';
        telemetryText.innerHTML = 'Authority Bias Pressure: Supervisor prioritizing shift dispatch over HASAW protocol.';
      }

      btnSafe.style.display = 'flex';
      btnUnsafe.style.display = 'flex';
      btnReset.style.display = 'none';
    });
  }
}

