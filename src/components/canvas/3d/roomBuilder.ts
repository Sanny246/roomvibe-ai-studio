import * as THREE from 'three';
import { Room } from '../../../types';
import { createWoodFloorTexture, createPlasterWallTexture } from './textures';

export interface RoomMeshes {
  group: THREE.Group;
  floorMesh: THREE.Mesh;
  wallMeshes: THREE.Mesh[];
  updateDimensions: (room: Room) => void;
  dispose: () => void;
}

export function buildRoomScene(room: Room): RoomMeshes {
  const group = new THREE.Group();
  group.name = 'room-structure';

  const { width, length, height } = room.dimensions;

  // 1. Textures & Materials
  let floorTex = createWoodFloorTexture(room.floorColor);
  let wallTex = createPlasterWallTexture(room.wallColor);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.6,
    metalness: 0.05,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const baseboardMat = new THREE.MeshStandardMaterial({
    color: '#E8E3D9',
    roughness: 0.5,
  });

  const curtainMat = new THREE.MeshStandardMaterial({
    color: '#FAF9F6',
    roughness: 0.9,
    transparent: true,
    opacity: 0.85,
  });

  const glassWindowMat = new THREE.MeshPhysicalMaterial({
    color: '#EBF4F6',
    transparent: true,
    opacity: 0.25,
    transmission: 0.92,
    roughness: 0.05,
    ior: 1.5,
  });

  // 2. Floor Plane
  const floorGeo = new THREE.PlaneGeometry(width, length);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Subtle floor contact border trim
  const trimMat = new THREE.MeshBasicMaterial({ color: '#D4C5B2', wireframe: false });
  const trimGeo = new THREE.RingGeometry(0.01, 0.02, 4);

  // 3. Walls (Back, Left, Right - keep Front open for camera overview)
  const wallMeshes: THREE.Mesh[] = [];

  // Back Wall (Z = -length / 2)
  const backWallGeo = new THREE.PlaneGeometry(width, height);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, height / 2, -length / 2);
  backWall.receiveShadow = true;
  group.add(backWall);
  wallMeshes.push(backWall);

  // Left Wall (X = -width / 2)
  const leftWallGeo = new THREE.PlaneGeometry(length, height);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);
  wallMeshes.push(leftWall);

  // Right Wall (X = width / 2) - Large French Window with Sheer Curtains as in reference photo
  const rightWallGeo = new THREE.PlaneGeometry(length, height);
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(width / 2, height / 2, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);
  wallMeshes.push(rightWall);

  // Window & Curtains Assembly (placed on the back or right wall)
  const windowGroup = new THREE.Group();
  windowGroup.name = 'window-curtain-group';

  // Sheer curtain pleats (vertical soft folds matching reference photo)
  const curtainWidth = length * 0.75;
  const curtainHeight = height * 0.88;
  const curtainGeo = new THREE.PlaneGeometry(curtainWidth, curtainHeight, 16, 1);

  // Displace vertices slightly to create curtain folds
  const pos = curtainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const wave = Math.sin(x * 24) * 0.035;
    pos.setZ(i, wave);
  }
  curtainGeo.computeVertexNormals();

  const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
  curtainMesh.rotation.y = -Math.PI / 2;
  curtainMesh.position.set(width / 2 - 0.06, curtainHeight / 2 + 0.08, 0);
  windowGroup.add(curtainMesh);

  // Window glass pane
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(curtainWidth, curtainHeight),
    glassWindowMat
  );
  windowGlass.rotation.y = -Math.PI / 2;
  windowGlass.position.set(width / 2 - 0.02, curtainHeight / 2 + 0.08, 0);
  windowGroup.add(windowGlass);

  // Curtain rod / valance box at top
  const valanceGeo = new THREE.BoxGeometry(0.12, 0.12, length * 0.82);
  const valanceMat = new THREE.MeshStandardMaterial({ color: '#FAF9F6', roughness: 0.5 });
  const valance = new THREE.Mesh(valanceGeo, valanceMat);
  valance.position.set(width / 2 - 0.08, height - 0.12, 0);
  windowGroup.add(valance);

  // Modern Wall Air Conditioner unit (matching reference photo above curtain)
  const acGeo = new THREE.BoxGeometry(0.22, 0.28, 0.82);
  const acMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.3 });
  const acUnit = new THREE.Mesh(acGeo, acMat);
  acUnit.position.set(width / 2 - 0.14, height - 0.32, -0.6);
  windowGroup.add(acUnit);

  group.add(windowGroup);

  // 4. Baseboards
  const baseboardHeight = 0.08;
  const baseboardThick = 0.015;

  // Back baseboard
  const bbBack = new THREE.Mesh(
    new THREE.BoxGeometry(width, baseboardHeight, baseboardThick),
    baseboardMat
  );
  bbBack.position.set(0, baseboardHeight / 2, -length / 2 + baseboardThick / 2);
  group.add(bbBack);

  // Left baseboard
  const bbLeft = new THREE.Mesh(
    new THREE.BoxGeometry(baseboardThick, baseboardHeight, length),
    baseboardMat
  );
  bbLeft.position.set(-width / 2 + baseboardThick / 2, baseboardHeight / 2, 0);
  group.add(bbLeft);

  // 5. Ceiling Recessed Spotlights (4 downlights as in reference photo)
  const downlightPositions = [
    [-width * 0.22, -length * 0.2],
    [width * 0.22, -length * 0.2],
    [-width * 0.22, length * 0.2],
    [width * 0.22, length * 0.2],
  ];

  const spotGlowMat = new THREE.MeshBasicMaterial({ color: '#FFF8E7' });
  const spotRingMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2 });

  downlightPositions.forEach(([x, z]) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.07, 24), spotRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, height - 0.01, z);
    group.add(ring);

    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), spotGlowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.set(x, height - 0.012, z);
    group.add(glow);

    // Warm soft spotlight shining down
    const spotLight = new THREE.PointLight('#FFF4DB', 0.6, 3.5, 1.2);
    spotLight.position.set(x, height - 0.1, z);
    group.add(spotLight);
  });

  // Dynamic dimension updater
  const updateDimensions = (newRoom: Room) => {
    const nw = newRoom.dimensions.width;
    const nl = newRoom.dimensions.length;
    const nh = newRoom.dimensions.height;

    floorMesh.geometry.dispose();
    floorMesh.geometry = new THREE.PlaneGeometry(nw, nl);

    backWall.geometry.dispose();
    backWall.geometry = new THREE.PlaneGeometry(nw, nh);
    backWall.position.set(0, nh / 2, -nl / 2);

    leftWall.geometry.dispose();
    leftWall.geometry = new THREE.PlaneGeometry(nl, nh);
    leftWall.position.set(-nw / 2, nh / 2, 0);

    rightWall.geometry.dispose();
    rightWall.geometry = new THREE.PlaneGeometry(nl, nh);
    rightWall.position.set(nw / 2, nh / 2, 0);

    curtainMesh.position.set(nw / 2 - 0.06, (nh * 0.88) / 2 + 0.08, 0);
    windowGlass.position.set(nw / 2 - 0.02, (nh * 0.88) / 2 + 0.08, 0);
    valance.position.set(nw / 2 - 0.08, nh - 0.12, 0);
    acUnit.position.set(nw / 2 - 0.14, nh - 0.32, -0.6);

    bbBack.geometry.dispose();
    bbBack.geometry = new THREE.BoxGeometry(nw, baseboardHeight, baseboardThick);
    bbBack.position.set(0, baseboardHeight / 2, -nl / 2 + baseboardThick / 2);

    bbLeft.geometry.dispose();
    bbLeft.geometry = new THREE.BoxGeometry(baseboardThick, baseboardHeight, nl);
    bbLeft.position.set(-nw / 2 + baseboardThick / 2, baseboardHeight / 2, 0);
  };

  const dispose = () => {
    floorTex.dispose();
    wallTex.dispose();
    floorGeo.dispose();
    backWallGeo.dispose();
    leftWallGeo.dispose();
    rightWallGeo.dispose();
  };

  return {
    group,
    floorMesh,
    wallMeshes,
    updateDimensions,
    dispose,
  };
}
