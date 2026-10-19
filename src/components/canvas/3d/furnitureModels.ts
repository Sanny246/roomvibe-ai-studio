import * as THREE from 'three';
import { Furniture, PlacedFurniture } from '../../../types';
import { createRugTexture } from './textures';

// Helper to create rounded beveled box geometry when needed or multi-segment boxes
function createBoxMesh(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createCylinderMesh(
  rTop: number,
  rBot: number,
  h: number,
  segments: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, segments);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Procedural Japandi 3D Furniture Generator
 * Meets Three.js standard:
 * - 3–12 distinct parts per object
 * - Pivots at bottom-center (Y=0 sits flush on ground)
 * - PBR materials with varied roughness / metalness
 */
export function buildFurnitureGroup(
  item: Furniture | PlacedFurniture,
  customColor?: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = `furniture-${item.modelType}`;

  const primaryColor = customColor || (item as any).defaultColor || '#DFD2C2';
  const colorObj = new THREE.Color(primaryColor);

  // Common materials
  const woodLightMat = new THREE.MeshStandardMaterial({
    color: '#D8C3A5',
    roughness: 0.65,
    metalness: 0.05,
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: '#6E5D4B',
    roughness: 0.7,
    metalness: 0.05,
  });

  const upholsteryMat = new THREE.MeshStandardMaterial({
    color: colorObj,
    roughness: 0.88,
    metalness: 0.02,
  });

  const cushionAccentMat = new THREE.MeshStandardMaterial({
    color: '#87988A', // Sage green accent pillow
    roughness: 0.85,
    metalness: 0.02,
  });

  const cushionBlushMat = new THREE.MeshStandardMaterial({
    color: '#CDB1A3', // Warm blush pillow from reference
    roughness: 0.85,
    metalness: 0.02,
  });

  const metalDarkMat = new THREE.MeshStandardMaterial({
    color: '#2A2A2A',
    roughness: 0.35,
    metalness: 0.85,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#C5A059',
    roughness: 0.28,
    metalness: 0.88,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.45,
    roughness: 0.08,
    transmission: 0.9,
    ior: 1.52,
    thickness: 0.05,
  });

  switch (item.modelType) {
    case 'sofa_linen': {
      // 1. Base wood rail
      group.add(createBoxMesh(2.06, 0.08, 0.82, woodLightMat, 0, 0.12, 0));

      // 2-5. Four tapered wood legs
      const legMat = woodLightMat;
      const legPositions = [
        [-0.95, 0.12, -0.34],
        [0.95, 0.12, -0.34],
        [-0.95, 0.12, 0.34],
        [0.95, 0.12, 0.34],
      ];
      legPositions.forEach(([x, y, z]) => {
        const leg = createCylinderMesh(0.03, 0.02, y, 16, legMat, x, 0, z);
        group.add(leg);
      });

      // 6. Base seat cushion platform
      group.add(createBoxMesh(2.0, 0.2, 0.8, upholsteryMat, 0, 0.2, 0));

      // 7-8. Two separate thick top seat cushions
      group.add(createBoxMesh(0.96, 0.14, 0.72, upholsteryMat, -0.49, 0.4, 0.04));
      group.add(createBoxMesh(0.96, 0.14, 0.72, upholsteryMat, 0.49, 0.4, 0.04));

      // 9. Backrest frame
      group.add(createBoxMesh(2.0, 0.38, 0.16, upholsteryMat, 0, 0.4, -0.32));

      // 10-11. Left & Right armrests
      group.add(createBoxMesh(0.16, 0.28, 0.78, upholsteryMat, -0.97, 0.38, 0));
      group.add(createBoxMesh(0.16, 0.28, 0.78, upholsteryMat, 0.97, 0.38, 0));

      // 12-13. Accent throw pillows
      const pillowGeo = new THREE.BoxGeometry(0.35, 0.35, 0.12);
      const pillow1 = new THREE.Mesh(pillowGeo, cushionAccentMat);
      pillow1.position.set(-0.7, 0.58, -0.18);
      pillow1.rotation.set(0.1, 0.25, -0.15);
      pillow1.castShadow = true;
      group.add(pillow1);

      const pillow2 = new THREE.Mesh(pillowGeo, cushionBlushMat);
      pillow2.position.set(0.7, 0.58, -0.18);
      pillow2.rotation.set(0.1, -0.2, 0.15);
      pillow2.castShadow = true;
      group.add(pillow2);
      break;
    }

    case 'armchair_rattan': {
      // 1. Curved ash wood legs
      group.add(createCylinderMesh(0.025, 0.02, 0.35, 12, woodLightMat, -0.32, 0, -0.3));
      group.add(createCylinderMesh(0.025, 0.02, 0.35, 12, woodLightMat, 0.32, 0, -0.3));
      group.add(createCylinderMesh(0.025, 0.02, 0.35, 12, woodLightMat, -0.32, 0, 0.3));
      group.add(createCylinderMesh(0.025, 0.02, 0.35, 12, woodLightMat, 0.32, 0, 0.3));

      // 2. Base perimeter wood frame
      group.add(createBoxMesh(0.68, 0.05, 0.68, woodLightMat, 0, 0.35, 0));

      // 3. Thick linen seat cushion
      group.add(createBoxMesh(0.62, 0.14, 0.62, upholsteryMat, 0, 0.4, 0));

      // 4. Rattan arched backrest
      const rattanMat = new THREE.MeshStandardMaterial({
        color: '#D4B892',
        roughness: 0.9,
        wireframe: false,
      });
      const backMesh = createBoxMesh(0.62, 0.42, 0.04, rattanMat, 0, 0.54, -0.3);
      backMesh.rotation.x = 0.12;
      group.add(backMesh);

      // 5-6. Sculptural armrests
      group.add(createBoxMesh(0.06, 0.18, 0.6, woodLightMat, -0.34, 0.48, 0));
      group.add(createBoxMesh(0.06, 0.18, 0.6, woodLightMat, 0.34, 0.48, 0));
      break;
    }

    case 'table_round_coffee': {
      // 1. Top tabletop disk
      group.add(createCylinderMesh(0.42, 0.42, 0.035, 32, woodLightMat, 0, 0.385, 0));

      // 2. Lower slatted shelf disk
      group.add(createCylinderMesh(0.32, 0.32, 0.02, 32, woodDarkMat, 0, 0.16, 0));

      // 3-5. Three angled wooden legs
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      angles.forEach((angle) => {
        const x = Math.cos(angle) * 0.32;
        const z = Math.sin(angle) * 0.32;
        const leg = createCylinderMesh(0.022, 0.016, 0.385, 16, woodLightMat, x, 0, z);
        leg.rotation.z = Math.cos(angle) * -0.08;
        leg.rotation.x = Math.sin(angle) * 0.08;
        group.add(leg);
      });

      // 6. Ceramic coffee cup & book decor
      const ceramicMat = new THREE.MeshStandardMaterial({ color: '#FAF8F5', roughness: 0.2 });
      group.add(createCylinderMesh(0.045, 0.035, 0.07, 16, ceramicMat, 0.08, 0.42, 0.08));
      const bookMat = new THREE.MeshStandardMaterial({ color: '#87988A', roughness: 0.6 });
      group.add(createBoxMesh(0.18, 0.025, 0.24, bookMat, -0.06, 0.42, -0.04));
      break;
    }

    case 'table_dining_set': {
      // 1. Solid rectangular dining tabletop
      group.add(createBoxMesh(1.6, 0.045, 0.85, woodLightMat, 0, 0.705, 0));

      // 2-5. Four dining table legs
      const dLegPositions = [
        [-0.72, 0, -0.35],
        [0.72, 0, -0.35],
        [-0.72, 0, 0.35],
        [0.72, 0, 0.35],
      ];
      dLegPositions.forEach(([x, y, z]) => {
        group.add(createBoxMesh(0.06, 0.705, 0.06, woodLightMat, x, y, z));
      });

      // 6-9. Four matching minimalist dining chairs
      const chairConfigs = [
        { x: -0.4, z: -0.55, rotY: 0 },
        { x: 0.4, z: -0.55, rotY: 0 },
        { x: -0.4, z: 0.55, rotY: Math.PI },
        { x: 0.4, z: 0.55, rotY: Math.PI },
      ];
      chairConfigs.forEach((cfg) => {
        const chair = new THREE.Group();
        chair.position.set(cfg.x, 0, cfg.z);
        chair.rotation.y = cfg.rotY;

        // Chair legs & seat
        chair.add(createBoxMesh(0.4, 0.03, 0.4, woodLightMat, 0, 0.42, 0));
        chair.add(createBoxMesh(0.03, 0.42, 0.03, woodLightMat, -0.16, 0, -0.16));
        chair.add(createBoxMesh(0.03, 0.42, 0.03, woodLightMat, 0.16, 0, -0.16));
        chair.add(createBoxMesh(0.03, 0.42, 0.03, woodLightMat, -0.16, 0, 0.16));
        chair.add(createBoxMesh(0.03, 0.42, 0.03, woodLightMat, 0.16, 0, 0.16));
        // Chair backrest
        chair.add(createBoxMesh(0.38, 0.35, 0.02, woodLightMat, 0, 0.45, -0.18));
        group.add(chair);
      });
      break;
    }

    case 'tv_console': {
      // Matches the low console in user reference photo:
      // White body with natural oak top and open middle cubby
      const whiteCabinetMat = new THREE.MeshStandardMaterial({
        color: '#F9F8F6',
        roughness: 0.45,
      });

      // 1. Lower cabinet body
      group.add(createBoxMesh(2.0, 0.36, 0.42, whiteCabinetMat, 0, 0.08, 0));

      // 2. Oak countertop surface
      group.add(createBoxMesh(2.04, 0.03, 0.44, woodLightMat, 0, 0.44, 0));

      // 3. Middle open audio / media compartment divider
      group.add(createBoxMesh(0.7, 0.02, 0.4, woodLightMat, 0, 0.26, 0.01));

      // 4-7. Low square feet
      group.add(createBoxMesh(0.06, 0.08, 0.06, woodLightMat, -0.92, 0, -0.16));
      group.add(createBoxMesh(0.06, 0.08, 0.06, woodLightMat, 0.92, 0, -0.16));
      group.add(createBoxMesh(0.06, 0.08, 0.06, woodLightMat, -0.92, 0, 0.16));
      group.add(createBoxMesh(0.06, 0.08, 0.06, woodLightMat, 0.92, 0, 0.16));

      // 8. Slatted door texture / fluting lines
      const slatMat = new THREE.MeshStandardMaterial({ color: '#D4C6B4', roughness: 0.6 });
      for (let s = -0.95; s <= -0.4; s += 0.06) {
        group.add(createBoxMesh(0.01, 0.32, 0.015, slatMat, s, 0.1, 0.215));
      }
      for (let s = 0.4; s <= 0.95; s += 0.06) {
        group.add(createBoxMesh(0.01, 0.32, 0.015, slatMat, s, 0.1, 0.215));
      }

      // 9. Tabletop accessories (circular speaker & mini plant)
      const speakerMat = new THREE.MeshStandardMaterial({ color: '#2C2C2C', roughness: 0.3 });
      group.add(createCylinderMesh(0.07, 0.07, 0.14, 24, speakerMat, 0.75, 0.47, 0));
      break;
    }

    case 'tall_display_cabinet': {
      // Key feature directly from user reference photo:
      // High floor-to-ceiling cabinet with glass door display shelves on top, closed white doors below
      const whiteMat = new THREE.MeshStandardMaterial({ color: '#FAF9F6', roughness: 0.4 });
      const woodInteriorMat = new THREE.MeshStandardMaterial({ color: '#E8DCCF', roughness: 0.5 });

      // 1. Lower enclosed cabinet (depth 0.4m, height 0.9m)
      group.add(createBoxMesh(0.9, 0.9, 0.4, whiteMat, 0, 0, 0));

      // 2. Upper display cabinet frame (depth 0.38m, height 1.2m)
      group.add(createBoxMesh(0.9, 0.03, 0.38, whiteMat, 0, 2.07, 0)); // Top cap
      group.add(createBoxMesh(0.03, 1.2, 0.38, whiteMat, -0.435, 0.9, 0)); // Left wall
      group.add(createBoxMesh(0.03, 1.2, 0.38, whiteMat, 0.435, 0.9, 0)); // Right wall
      group.add(createBoxMesh(0.84, 1.2, 0.02, woodInteriorMat, 0, 0.9, -0.18)); // Back interior board

      // 3-4. Two interior glass display shelves
      group.add(createBoxMesh(0.84, 0.012, 0.34, glassMat, 0, 1.3, 0));
      group.add(createBoxMesh(0.84, 0.012, 0.34, glassMat, 0, 1.7, 0));

      // 5. Front outer glass doors
      group.add(createBoxMesh(0.41, 1.16, 0.01, glassMat, -0.21, 0.92, 0.18));
      group.add(createBoxMesh(0.41, 1.16, 0.01, glassMat, 0.21, 0.92, 0.18));

      // 6. Display items inside (olive green wine bottles from reference photo!)
      const bottleMat = new THREE.MeshPhysicalMaterial({
        color: '#4B6B48',
        roughness: 0.1,
        transmission: 0.8,
        ior: 1.5,
      });
      group.add(createCylinderMesh(0.035, 0.035, 0.22, 16, bottleMat, -0.15, 1.32, 0));
      group.add(createCylinderMesh(0.035, 0.035, 0.22, 16, bottleMat, -0.05, 1.32, 0));

      // 7. Warm ambient strip backlight effect
      const stripLightMat = new THREE.MeshBasicMaterial({ color: '#FFF3DB' });
      group.add(createBoxMesh(0.8, 0.015, 0.02, stripLightMat, 0, 2.05, -0.14));
      break;
    }

    case 'tv_screen': {
      // 1. Slim TV bezel
      group.add(createBoxMesh(1.25, 0.72, 0.03, metalDarkMat, 0, 0.16, 0));

      // 2. High-gloss black screen panel
      const oledMat = new THREE.MeshStandardMaterial({
        color: '#111111',
        roughness: 0.12,
        metalness: 0.9,
      });
      group.add(createBoxMesh(1.22, 0.69, 0.005, oledMat, 0, 0.175, 0.016));

      // 3. Central desk stand base
      group.add(createBoxMesh(0.38, 0.012, 0.22, metalDarkMat, 0, 0, 0));
      group.add(createBoxMesh(0.08, 0.16, 0.04, metalDarkMat, 0, 0.012, 0));
      break;
    }

    case 'bed_platform': {
      // 1. Low wooden bed frame platform
      group.add(createBoxMesh(1.68, 0.22, 2.12, woodLightMat, 0, 0, 0));

      // 2. Slatted headboard
      group.add(createBoxMesh(1.68, 0.75, 0.08, woodLightMat, 0, 0.22, -1.02));

      // 3. Comfortable thick mattress
      const mattressMat = new THREE.MeshStandardMaterial({ color: '#F7F6F2', roughness: 0.9 });
      group.add(createBoxMesh(1.58, 0.26, 1.98, mattressMat, 0, 0.22, 0.02));

      // 4. Folded duvet cover
      const duvetMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.95 });
      group.add(createBoxMesh(1.59, 0.12, 1.35, duvetMat, 0, 0.44, 0.32));

      // 5-6. Two sleeping pillows
      const pillowMat = new THREE.MeshStandardMaterial({ color: '#FAF8F5', roughness: 0.85 });
      group.add(createBoxMesh(0.62, 0.12, 0.4, pillowMat, -0.42, 0.48, -0.65));
      group.add(createBoxMesh(0.62, 0.12, 0.4, pillowMat, 0.42, 0.48, -0.65));
      break;
    }

    case 'floor_lamp_arc': {
      // 1. Weighted circular base
      group.add(createCylinderMesh(0.2, 0.2, 0.03, 32, brassMat, 0, 0, 0));

      // 2. Slender upright and curved arch stem
      group.add(createCylinderMesh(0.015, 0.015, 1.4, 16, brassMat, 0, 0.03, 0));

      // 3. Top curved arm extension
      const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.45, 12);
      const arm = new THREE.Mesh(armGeo, brassMat);
      arm.rotation.z = Math.PI / 4;
      arm.position.set(0.15, 1.5, 0);
      group.add(arm);

      // 4. Cream linen drum lampshade
      const shadeMat = new THREE.MeshStandardMaterial({
        color: '#F4ECE1',
        roughness: 0.7,
        emissive: '#FFF3DB',
        emissiveIntensity: 0.6,
      });
      group.add(createCylinderMesh(0.18, 0.22, 0.26, 32, shadeMat, 0.3, 1.35, 0));
      break;
    }

    case 'plant_fiddle': {
      // 1. Minimal ceramic pot
      const potMat = new THREE.MeshStandardMaterial({ color: '#F9F8F5', roughness: 0.5 });
      group.add(createCylinderMesh(0.22, 0.18, 0.42, 32, potMat, 0, 0, 0));

      // 2. Dark fertile soil surface
      const soilMat = new THREE.MeshStandardMaterial({ color: '#3A2E26', roughness: 0.95 });
      group.add(createCylinderMesh(0.2, 0.2, 0.02, 24, soilMat, 0, 0.4, 0));

      // 3. Central trunk stem
      group.add(createCylinderMesh(0.02, 0.025, 0.85, 12, woodDarkMat, 0, 0.4, 0));

      // 4-11. Large lush fiddle leaves
      const leafMat = new THREE.MeshStandardMaterial({
        color: '#4B6B48',
        roughness: 0.35,
        side: THREE.DoubleSide,
      });
      const leafGeo = new THREE.PlaneGeometry(0.22, 0.32);

      const leafConfigs = [
        { y: 0.65, rotX: 0.5, rotY: 0, rotZ: 0.3 },
        { y: 0.75, rotX: 0.4, rotY: 1.2, rotZ: -0.2 },
        { y: 0.88, rotX: 0.6, rotY: 2.3, rotZ: 0.1 },
        { y: 1.0, rotX: 0.3, rotY: 3.5, rotZ: -0.3 },
        { y: 1.1, rotX: 0.5, rotY: 4.8, rotZ: 0.2 },
        { y: 1.2, rotX: 0.2, rotY: 5.9, rotZ: 0.0 },
      ];

      leafConfigs.forEach((cfg) => {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, cfg.y, 0);
        leaf.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
        leaf.translateY(0.12);
        leaf.castShadow = true;
        group.add(leaf);
      });
      break;
    }

    case 'rug_wool': {
      // Flat textured rug
      const rugTex = createRugTexture();
      const rugMat = new THREE.MeshStandardMaterial({
        map: rugTex,
        roughness: 0.95,
        metalness: 0.0,
      });
      const rugMesh = createBoxMesh(2.4, 0.015, 1.6, rugMat, 0, 0, 0);
      group.add(rugMesh);
      break;
    }

    default: {
      // Default elegant Scandinavian credenza box
      group.add(createBoxMesh(1.0, 0.6, 0.5, woodLightMat, 0, 0, 0));
      break;
    }
  }

  // Set user data for identification & raycasting
  const fId = 'furnitureId' in item ? item.furnitureId : item.id;
  const instId = 'instanceId' in item ? item.instanceId : null;

  group.userData = {
    isFurniture: true,
    furnitureId: fId,
    instanceId: instId,
  };

  return group;
}
