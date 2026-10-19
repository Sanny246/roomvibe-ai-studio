import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Room, PlacedFurniture } from '../../types';
import { buildRoomScene, RoomMeshes } from './3d/roomBuilder';
import { buildFurnitureGroup } from './3d/furnitureModels';

interface RoomCanvasProps {
  room: Room;
  placedFurnitures: PlacedFurniture[];
  selectedInstanceId: string | null;
  onSelectFurniture: (instanceId: string | null) => void;
  onUpdateFurniturePosition: (instanceId: string, position: [number, number, number]) => void;
  viewMode: 'orbit' | 'top' | 'eye';
  snapToGrid: boolean;
  onCanvasReady?: (captureFn: () => string) => void;
}

// Reusable math objects to eliminate GC in render loop
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _intersectPoint = new THREE.Vector3();
const _targetCameraPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
  room,
  placedFurnitures,
  selectedInstanceId,
  onSelectFurniture,
  onUpdateFurniturePosition,
  viewMode,
  snapToGrid,
  onCanvasReady,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep mutable state accessible to callbacks & render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roomMeshesRef = useRef<RoomMeshes | null>(null);
  const furnitureGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);
  const groundGridRef = useRef<THREE.GridHelper | null>(null);

  const draggingIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isPointerDownRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);

  // Keep latest props in refs for event listeners
  const placedFurnituresRef = useRef(placedFurnitures);
  placedFurnituresRef.current = placedFurnitures;

  const roomRef = useRef(room);
  roomRef.current = room;

  const selectedIdRef = useRef(selectedInstanceId);
  selectedIdRef.current = selectedInstanceId;

  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;

  // View transition target
  const isTransitioningCamera = useRef(false);

  // Canvas export handler
  const captureScreenshot = useCallback((): string => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return '';
    // Hide grid and selection box temporarily for clean screenshot
    if (selectionBoxRef.current) selectionBoxRef.current.visible = false;
    if (groundGridRef.current) groundGridRef.current.visible = false;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png', 1.0);

    // Restore visibility
    if (selectionBoxRef.current && selectedIdRef.current) selectionBoxRef.current.visible = true;
    if (groundGridRef.current) groundGridRef.current.visible = true;

    return dataUrl;
  }, []);

  useEffect(() => {
    if (onCanvasReady) {
      onCanvasReady(captureScreenshot);
    }
  }, [onCanvasReady, captureScreenshot]);

  // Handle Camera view modes
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    isTransitioningCamera.current = true;

    if (viewMode === 'top') {
      _targetCameraPos.set(0, Math.max(room.dimensions.width, room.dimensions.length) * 1.5, 0.01);
      _targetLookAt.set(0, 0, 0);
      controls.maxPolarAngle = 0.05;
      controls.minPolarAngle = 0.0;
    } else if (viewMode === 'eye') {
      _targetCameraPos.set(0, 1.4, room.dimensions.length * 0.45);
      _targetLookAt.set(0, 1.2, 0);
      controls.maxPolarAngle = Math.PI / 2 + 0.1;
      controls.minPolarAngle = 0.2;
    } else {
      // 3D Orbit perspective
      _targetCameraPos.set(
        room.dimensions.width * 0.85,
        room.dimensions.height * 1.25,
        room.dimensions.length * 0.95
      );
      _targetLookAt.set(0, 0.8, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below floor
      controls.minPolarAngle = 0.1;
    }
  }, [viewMode, room.dimensions]);

  // Main Three.js Scene Setup (Mount Once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Background matching brand background #F7F5F0
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F5F0');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.2, 4.0, 4.6);
    cameraRef.current = camera;

    // 3. Renderer with high PBR standards
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    // Warm natural daylight from window (Back-Right)
    const sunLight = new THREE.DirectionalLight('#FFF9EE', 2.2);
    sunLight.position.set(5, 4.5, 3.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 15;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    const d = 5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Warm ambient fill matching Japandi palette
    const hemiLight = new THREE.HemisphereLight('#FFFDF9', '#EAE3D5', 0.9);
    scene.add(hemiLight);

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 1.0;
    controls.maxDistance = 16.0;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    // 7. Ground Grid Helper for precision alignment
    const grid = new THREE.GridHelper(10, 20, '#D8C3A5', '#EAE4D9');
    grid.position.y = 0.005;
    scene.add(grid);
    groundGridRef.current = grid;

    // 8. Room Structure Scene
    const roomMeshes = buildRoomScene(roomRef.current);
    scene.add(roomMeshes.group);
    roomMeshesRef.current = roomMeshes;

    // 9. Selection Outline Box Helper
    const dummyObj = new THREE.Object3D();
    const boxHelper = new THREE.BoxHelper(dummyObj, '#87988A');
    boxHelper.visible = false;
    scene.add(boxHelper);
    selectionBoxRef.current = boxHelper;

    // Pre-warm shader pipeline
    renderer.compile(scene, camera);

    // Animation Loop with smooth damping
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera interpolation if transitioning
      if (isTransitioningCamera.current) {
        camera.position.lerp(_targetCameraPos, 0.08);
        controls.target.lerp(_targetLookAt, 0.08);
        if (camera.position.distanceTo(_targetCameraPos) < 0.05) {
          isTransitioningCamera.current = false;
        }
      }

      controls.update();

      // Update selection box if active
      if (boxHelper.visible && selectedIdRef.current) {
        const selectedGroup = furnitureGroupsRef.current.get(selectedIdRef.current);
        if (selectedGroup) {
          boxHelper.setFromObject(selectedGroup);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Pointer Event Listeners for Raycasting, Selection, and Dragging
    const dom = renderer.domElement;

    const getPointerCoords = (e: MouseEvent | Touch) => {
      const rect = dom.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return { x, y };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const client = 'touches' in e ? e.touches[0] : e;
      if (!client) return;

      isPointerDownRef.current = true;
      hasMovedRef.current = false;

      const { x, y } = getPointerCoords(client);
      _pointer.set(x, y);
      _raycaster.setFromCamera(_pointer, camera);

      // Collect furniture groups for raycasting
      const furnitureMeshes: THREE.Object3D[] = [];
      furnitureGroupsRef.current.forEach((grp) => {
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            furnitureMeshes.push(child);
          }
        });
      });

      const intersects = _raycaster.intersectObjects(furnitureMeshes, true);

      if (intersects.length > 0) {
        // Find topmost furniture group parent
        let targetGroup: THREE.Group | null = null;
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr !== scene) {
          if (curr.userData && curr.userData.isFurniture) {
            targetGroup = curr as THREE.Group;
            break;
          }
          curr = curr.parent;
        }

        if (targetGroup && targetGroup.userData.instanceId) {
          const instId = targetGroup.userData.instanceId;
          onSelectFurniture(instId);

          // Prepare dragging
          draggingIdRef.current = instId;
          controls.enabled = false; // Disable orbit while dragging

          // Compute drag offset on ground plane
          if (_raycaster.ray.intersectPlane(_plane, _intersectPoint)) {
            dragOffsetRef.current.copy(targetGroup.position).sub(_intersectPoint);
          }
          return;
        }
      }

      // If clicked on floor or empty space
      draggingIdRef.current = null;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const client = 'touches' in e ? e.touches[0] : e;
      if (!client) return;

      if (!isPointerDownRef.current) return;
      hasMovedRef.current = true;

      if (!draggingIdRef.current) return;

      const { x, y } = getPointerCoords(client);
      _pointer.set(x, y);
      _raycaster.setFromCamera(_pointer, camera);

      if (_raycaster.ray.intersectPlane(_plane, _intersectPoint)) {
        const newPos = _intersectPoint.clone().add(dragOffsetRef.current);

        // Grid snapping
        if (snapToGridRef.current) {
          const snap = 0.1; // 10cm grid snap
          newPos.x = Math.round(newPos.x / snap) * snap;
          newPos.z = Math.round(newPos.z / snap) * snap;
        }

        // Clamp inside room boundary
        const roomW = roomRef.current.dimensions.width;
        const roomL = roomRef.current.dimensions.length;
        const padding = 0.2;
        newPos.x = THREE.MathUtils.clamp(newPos.x, -roomW / 2 + padding, roomW / 2 - padding);
        newPos.z = THREE.MathUtils.clamp(newPos.z, -roomL / 2 + padding, roomL / 2 - padding);
        newPos.y = 0; // Stick flush to floor

        // Update group position in 3D scene immediately
        const grp = furnitureGroupsRef.current.get(draggingIdRef.current);
        if (grp) {
          grp.position.copy(newPos);
        }

        // Notify parent state
        onUpdateFurniturePosition(draggingIdRef.current, [newPos.x, newPos.y, newPos.z]);
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      controls.enabled = true; // Re-enable orbit

      // If clicked without dragging, and nothing was selected, deselect
      if (!hasMovedRef.current && !draggingIdRef.current) {
        onSelectFurniture(null);
      }
      draggingIdRef.current = null;
    };

    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      controls.dispose();
      roomMeshes.dispose();
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  // Sync Room Dimensions and Colors
  useEffect(() => {
    if (!roomMeshesRef.current) return;
    roomMeshesRef.current.updateDimensions(room);
  }, [room]);

  // Sync Placed Furniture Groups
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = furnitureGroupsRef.current;
    const incomingIds = new Set(placedFurnitures.map((f) => f.instanceId));

    // Remove deleted items
    currentMap.forEach((grp, id) => {
      if (!incomingIds.has(id)) {
        scene.remove(grp);
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else {
              m.material.dispose();
            }
          }
        });
        currentMap.delete(id);
      }
    });

    // Add or update items
    placedFurnitures.forEach((item) => {
      let grp = currentMap.get(item.instanceId);

      if (!grp) {
        // Build new 3D group
        grp = buildFurnitureGroup(item, item.customColor);
        grp.userData.instanceId = item.instanceId;
        scene.add(grp);
        currentMap.set(item.instanceId, grp);
      }

      // Update transform
      grp.position.set(item.position[0], item.position[1], item.position[2]);
      grp.rotation.y = item.rotation;
      grp.scale.set(item.scale[0], item.scale[1], item.scale[2]);
    });
  }, [placedFurnitures]);

  // Update selection box visibility
  useEffect(() => {
    if (!selectionBoxRef.current) return;
    if (selectedInstanceId) {
      const grp = furnitureGroupsRef.current.get(selectedInstanceId);
      if (grp) {
        selectionBoxRef.current.setFromObject(grp);
        selectionBoxRef.current.visible = true;
      } else {
        selectionBoxRef.current.visible = false;
      }
    } else {
      selectionBoxRef.current.visible = false;
    }
  }, [selectedInstanceId, placedFurnitures]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
    />
  );
};
