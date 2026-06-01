"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Crosshair, Globe2, Home, Map as MapIcon, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { feature as topoJsonFeature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";

type ViewMode = "globe" | "projection";

type KnowledgeNode = {
  title: string;
  place: string;
  time: string;
  lat: number;
  lon: number;
  tags: string[];
  attributes: Record<string, string | number>;
  image: string;
  intensity: number;
  popupClassName: string;
};

type MapSignal = Pick<KnowledgeNode, "lat" | "lon" | "intensity">;
type LatLon = [number, number];
type LonLat = [number, number];
type GeoJsonGeometry = { type: "Polygon"; coordinates: LonLat[][] } | { type: "MultiPolygon"; coordinates: LonLat[][][] };
type GeoJsonFeatureCollection = { features: Array<{ geometry: GeoJsonGeometry | null }> };
type WorldTopology = Topology<{ countries: GeometryCollection }>;

const nodes: KnowledgeNode[] = [
  {
    title: "Colosseum",
    place: "Rome, Italy",
    time: "2nd century AD",
    lat: 41.8902,
    lon: 12.4922,
    tags: ["archaeological_site", "roman_empire", "amphitheatre"],
    attributes: { country: "Italy", era: "Imperial Rome" },
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=240&q=80",
    intensity: 0.78,
    popupClassName: "left-[10%] top-[19%] w-[260px]"
  },
  {
    title: "Machu Picchu",
    place: "Cusco Region, Peru",
    time: "15th century",
    lat: -13.1631,
    lon: -72.545,
    tags: ["archaeological_site", "inca", "unesco"],
    attributes: { country: "Peru", elevation_m: 2430 },
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=240&q=80",
    intensity: 0.86,
    popupClassName: "right-[9%] top-[43%] w-[250px]"
  },
  {
    title: "Pyramids of Giza",
    place: "Giza, Egypt",
    time: "c. 2560 BC",
    lat: 29.9792,
    lon: 31.1342,
    tags: ["archaeological_site", "ancient_egypt", "unesco"],
    attributes: { country: "Egypt", monument_type: "Pyramid complex" },
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=240&q=80",
    intensity: 0.9,
    popupClassName: "left-[41%] top-[56%] w-[260px]"
  },
  {
    title: "Battle of Stalingrad",
    place: "Volgograd, Russia",
    time: "1942-1943",
    lat: 48.708,
    lon: 44.514,
    tags: ["battle", "ww2", "urban_warfare"],
    attributes: { deaths_estimate: 1100000, year: 1942 },
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=240&q=80",
    intensity: 0.98,
    popupClassName: "hidden"
  },
  {
    title: "Chernobyl Nuclear Power Plant",
    place: "Pripyat, Ukraine",
    time: "1986 disaster",
    lat: 51.389,
    lon: 30.099,
    tags: ["nuclear", "disaster", "energy"],
    attributes: { reactor: "RBMK", year: 1986 },
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80",
    intensity: 0.82,
    popupClassName: "hidden"
  },
  {
    title: "Kashagan Offshore Field",
    place: "Caspian Sea",
    time: "Production since 2016",
    lat: 46.45,
    lon: 52.12,
    tags: ["oil_platform", "offshore", "energy"],
    attributes: { resource: "oil", country: "Kazakhstan" },
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80",
    intensity: 0.7,
    popupClassName: "hidden"
  },
  {
    title: "Fukushima Daiichi",
    place: "Okuma, Japan",
    time: "2011 disaster",
    lat: 37.421,
    lon: 141.033,
    tags: ["nuclear", "disaster", "tsunami"],
    attributes: { year: 2011, country: "Japan" },
    image: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=240&q=80",
    intensity: 0.76,
    popupClassName: "hidden"
  },
  {
    title: "Escondida Mine",
    place: "Atacama Desert, Chile",
    time: "Copper mine",
    lat: -24.27,
    lon: -69.07,
    tags: ["mine", "copper", "industry"],
    attributes: { commodity: "copper", country: "Chile" },
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=240&q=80",
    intensity: 0.82,
    popupClassName: "hidden"
  },
  {
    title: "Deepwater Horizon Site",
    place: "Gulf of Mexico",
    time: "2010 spill",
    lat: 28.736,
    lon: -88.366,
    tags: ["oil_platform", "disaster", "offshore"],
    attributes: { year: 2010, depth_m: 1500 },
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80",
    intensity: 0.72,
    popupClassName: "hidden"
  },
  {
    title: "Great Zimbabwe",
    place: "Masvingo, Zimbabwe",
    time: "11th-15th century",
    lat: -20.267,
    lon: 30.933,
    tags: ["archaeological_site", "africa", "unesco"],
    attributes: { country: "Zimbabwe", period: "Medieval" },
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=240&q=80",
    intensity: 0.58,
    popupClassName: "hidden"
  },
  {
    title: "Suez Canal Route",
    place: "Egypt",
    time: "Opened 1869",
    lat: 30.58,
    lon: 32.28,
    tags: ["route", "shipping", "infrastructure"],
    attributes: { length_km: 193, country: "Egypt" },
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=240&q=80",
    intensity: 0.62,
    popupClassName: "hidden"
  },
  {
    title: "Silicon Valley AI Cluster",
    place: "California, USA",
    time: "Active",
    lat: 37.386,
    lon: -122.083,
    tags: ["ai", "research", "startup_ecosystem"],
    attributes: { country: "USA", sector: "technology" },
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=80",
    intensity: 0.66,
    popupClassName: "hidden"
  }
];

const ambientSignals: MapSignal[] = [
  { lat: 52.52, lon: 13.405, intensity: 0.54 },
  { lat: 48.8566, lon: 2.3522, intensity: 0.68 },
  { lat: 51.5072, lon: -0.1276, intensity: 0.58 },
  { lat: 40.4168, lon: -3.7038, intensity: 0.48 },
  { lat: 37.9838, lon: 23.7275, intensity: 0.74 },
  { lat: 34.0522, lon: -118.2437, intensity: 0.62 },
  { lat: 19.4326, lon: -99.1332, intensity: 0.7 },
  { lat: -12.0464, lon: -77.0428, intensity: 0.56 },
  { lat: -33.4489, lon: -70.6693, intensity: 0.64 },
  { lat: -23.5505, lon: -46.6333, intensity: 0.72 },
  { lat: 6.5244, lon: 3.3792, intensity: 0.58 },
  { lat: -1.2921, lon: 36.8219, intensity: 0.5 },
  { lat: -26.2041, lon: 28.0473, intensity: 0.54 },
  { lat: 25.2048, lon: 55.2708, intensity: 0.68 },
  { lat: 28.6139, lon: 77.209, intensity: 0.8 },
  { lat: 19.076, lon: 72.8777, intensity: 0.66 },
  { lat: 13.7563, lon: 100.5018, intensity: 0.7 },
  { lat: 1.3521, lon: 103.8198, intensity: 0.78 },
  { lat: 35.6762, lon: 139.6503, intensity: 0.76 },
  { lat: 31.2304, lon: 121.4737, intensity: 0.82 },
  { lat: 39.9042, lon: 116.4074, intensity: 0.72 },
  { lat: -33.8688, lon: 151.2093, intensity: 0.52 },
  { lat: 55.7558, lon: 37.6173, intensity: 0.62 },
  { lat: 41.0082, lon: 28.9784, intensity: 0.64 },
  { lat: 35.6892, lon: 51.389, intensity: 0.58 }
];

const mapSignals: MapSignal[] = [
  ...nodes.map(({ lat, lon, intensity }) => ({ lat, lon, intensity })),
  ...ambientSignals
];

const routes: Array<{ name: string; coordinates: Array<[number, number]> }> = [
  {
    name: "Trans-Eurasian energy route",
    coordinates: [
      [52.2, 4.9],
      [50.1, 14.4],
      [47.5, 19.0],
      [41.0, 29.0],
      [39.9, 44.5],
      [35.7, 51.4]
    ]
  },
  {
    name: "Maritime chokepoint route",
    coordinates: [
      [36.1, -5.4],
      [35.9, 14.5],
      [30.6, 32.3],
      [12.6, 43.3],
      [1.3, 103.8]
    ]
  }
];

const zones: Array<{ name: string; coordinates: Array<[number, number]> }> = [
  {
    name: "Eastern Mediterranean survey zone",
    coordinates: [
      [37, 19],
      [39, 31],
      [33, 36],
      [29, 28],
      [31, 20],
      [37, 19]
    ]
  }
];

function splitAntimeridianRing(ring: LonLat[]) {
  const segments: LatLon[][] = [];
  let current: LatLon[] = [];
  let previousLon: number | null = null;

  ring.forEach(([lon, lat]) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (previousLon !== null && Math.abs(lon - previousLon) > 180) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push([lat, lon]);
    previousLon = lon;
  });

  if (current.length > 1) segments.push(current);
  return segments;
}

function buildLandOutlines() {
  const topology = countries110m as unknown as WorldTopology;
  const collection = topoJsonFeature(topology, topology.objects.countries) as unknown as GeoJsonFeatureCollection;

  return collection.features.flatMap((countryFeature) => {
    const geometry = countryFeature.geometry;
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates.flatMap(splitAntimeridianRing);
    return geometry.coordinates.flatMap((polygon) => polygon.flatMap(splitAntimeridianRing));
  });
}

const landOutlines = buildLandOutlines();

function project(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 620
  };
}

function polylinePoints(coordinates: Array<[number, number]>) {
  return coordinates.map(([lat, lon]) => {
    const point = project(lat, lon);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  });
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(radius * Math.cos(phi) * Math.sin(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.cos(theta));
}

function makeLineGeometry(coordinates: Array<[number, number]>, radius: number) {
  const positions = coordinates.flatMap(([lat, lon]) => {
    const point = latLonToVector3(lat, lon, radius);
    return [point.x, point.y, point.z];
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(48, 48, 3, 48, 48, 44);
  gradient.addColorStop(0, "rgba(239,68,68,0.95)");
  gradient.addColorStop(0.22, "rgba(250,204,21,0.92)");
  gradient.addColorStop(0.46, "rgba(34,211,238,0.62)");
  gradient.addColorStop(0.76, "rgba(59,130,246,0.18)");
  gradient.addColorStop(1, "rgba(59,130,246,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(canvas);
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

function zoomBoundsForMode(mode: ViewMode) {
  return mode === "projection" ? { min: 0.8, max: 2.2, step: 0.2 } : { min: 0.85, max: 1.55, step: 0.14 };
}

function ThreeGlobe({
  showHeat,
  showNodes,
  showBorders,
  selectedNodeTitle,
  zoom,
  onSelectNode
}: {
  showHeat: boolean;
  showNodes: boolean;
  showBorders: boolean;
  selectedNodeTitle: string | null;
  zoom: number;
  onSelectNode: (title: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.55 / zoom);

    const globe = new THREE.Group();
    globe.rotation.x = -0.18;
    globe.rotation.y = -0.22;
    globe.position.y = -0.08;
    scene.add(globe);

    scene.add(new THREE.AmbientLight(0xffffff, 2.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(-2.5, 2.6, 4);
    scene.add(keyLight);

    const radius = 1.5;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0xf0f0ec,
        roughness: 0.82,
        metalness: 0,
        clearcoat: 0.15,
        transparent: true,
        opacity: 0.96
      })
    );
    sphere.renderOrder = 0;
    globe.add(sphere);

    const graticuleMaterial = new THREE.LineBasicMaterial({ color: 0xcfcfca, transparent: true, opacity: 0.8 });
    if (showBorders) {
      for (let lat = -60; lat <= 60; lat += 20) {
        const coordinates: Array<[number, number]> = [];
        for (let lon = -180; lon <= 180; lon += 4) coordinates.push([lat, lon]);
        globe.add(new THREE.Line(makeLineGeometry(coordinates, radius + 0.006), graticuleMaterial));
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        const coordinates: Array<[number, number]> = [];
        for (let lat = -80; lat <= 80; lat += 4) coordinates.push([lat, lon]);
        globe.add(new THREE.Line(makeLineGeometry(coordinates, radius + 0.006), graticuleMaterial));
      }
    }

    const landMaterial = new THREE.LineBasicMaterial({ color: 0x5f5f59, transparent: true, opacity: 0.9 });
    landOutlines.forEach((outline) => globe.add(new THREE.Line(makeLineGeometry(outline, radius + 0.012), landMaterial)));

    const routeMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.8 });
    routes.forEach((route) => globe.add(new THREE.Line(makeLineGeometry(route.coordinates, radius + 0.026), routeMaterial)));

    const zoneMaterial = new THREE.LineBasicMaterial({ color: 0xb45309, transparent: true, opacity: 0.82 });
    zones.forEach((zone) => globe.add(new THREE.Line(makeLineGeometry(zone.coordinates, radius + 0.03), zoneMaterial)));

    const glowTexture = makeGlowTexture();
    if (showHeat && glowTexture) {
      mapSignals.forEach((node) => {
        const material = new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.renderOrder = 20;
        sprite.position.copy(latLonToVector3(node.lat, node.lon, radius + 0.04));
        const scale = 0.14 + node.intensity * 0.1;
        sprite.scale.set(scale, scale, 1);
        globe.add(sprite);
      });
    }

    if (showNodes) {
      const nodeGeometry = new THREE.SphereGeometry(0.007, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x5b21b6, depthTest: false, depthWrite: false, transparent: true, opacity: 1 });
      mapSignals.forEach((node) => {
        const marker = new THREE.Mesh(nodeGeometry, nodeMaterial);
        marker.renderOrder = 40;
        marker.position.copy(latLonToVector3(node.lat, node.lon, radius + 0.055));
        globe.add(marker);
      });
    }

    const clickableMarkers: THREE.Object3D[] = [];
    const hitGeometry = new THREE.SphereGeometry(0.045, 12, 12);
    nodes.forEach((node) => {
      const isSelected = node.title === selectedNodeTitle;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.017 : 0.011, 16, 16),
        new THREE.MeshBasicMaterial({ color: isSelected ? 0x171717 : 0x5b21b6, depthTest: false, depthWrite: false })
      );
      marker.renderOrder = 45;
      marker.position.copy(latLonToVector3(node.lat, node.lon, radius + 0.065));
      globe.add(marker);

      const hitTarget = new THREE.Mesh(
        hitGeometry,
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false })
      );
      hitTarget.position.copy(latLonToVector3(node.lat, node.lon, radius + 0.08));
      hitTarget.userData.nodeTitle = node.title;
      clickableMarkers.push(hitTarget);
      globe.add(hitTarget);
    });

    let width = 1;
    let height = 1;
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let dragging = false;
    let pointerMoved = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerMoved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 5) pointerMoved = true;
      globe.rotation.y += dx * 0.006;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + dy * 0.004, -0.8, 0.45);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (pointerMoved || !clickableMarkers.length) return;

      const bounds = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -(((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickableMarkers, false)[0];
      const title = hit?.object.userData.nodeTitle;
      if (typeof title === "string") onSelectNode(title);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    let frame = 0;
    const animate = () => {
      if (!reducedMotion && !dragging) globe.rotation.y += 0.0013;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      glowTexture?.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        }
      });
      renderer.dispose();
    };
  }, [onSelectNode, reducedMotion, selectedNodeTitle, showBorders, showHeat, showNodes, zoom]);

  return (
    <div className="absolute left-1/2 top-4 h-[780px] w-[780px] -translate-x-1/2 overflow-hidden rounded-full border border-neutral-300/80 bg-[#f0f0ec] shadow-[inset_28px_20px_70px_rgba(255,255,255,0.95),inset_-38px_-20px_90px_rgba(0,0,0,0.08)] md:h-[920px] md:w-[920px] xl:h-[1120px] xl:w-[1120px]">
      <div ref={containerRef} className="absolute inset-0" aria-label="Interactive 3D Wikimap globe">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_36%,rgba(255,255,255,0.38),rgba(255,255,255,0.64)_47%,rgba(0,0,0,0.04)_100%)]" />
        <canvas ref={canvasRef} data-testid="knowledge-world-canvas" className="absolute inset-0 z-10 h-full w-full" />
      </div>
    </div>
  );
}

function ProjectionMap({
  showHeat,
  showNodes,
  showBorders,
  showLabels,
  selectedNodeTitle,
  zoom,
  onSelectNode
}: {
  showHeat: boolean;
  showNodes: boolean;
  showBorders: boolean;
  showLabels: boolean;
  selectedNodeTitle: string | null;
  zoom: number;
  onSelectNode: (title: string) => void;
}) {
  const graticuleLat = [-60, -30, 0, 30, 60];
  const graticuleLon = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f7f7f4]">
      <svg
        className="absolute inset-0 h-full w-full transition-transform duration-300"
        style={{ transform: `scale(${zoom})`, transformOrigin: "50% 48%" }}
        viewBox="0 0 1000 620"
        role="img"
        aria-label="2D world projection showing Wikimap knowledge nodes"
      >
        <defs>
          <radialGradient id="projectionHeat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity="0.96" />
            <stop offset="24%" stopColor="rgb(250 204 21)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="rgb(34 211 238)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1000" height="620" fill="#f7f7f4" />
        {showBorders &&
          graticuleLat.map((lat) => {
            const start = project(lat, -180);
            const end = project(lat, 180);
            return <line key={`lat-${lat}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#d7d7d2" strokeWidth="1" />;
          })}
        {showBorders &&
          graticuleLon.map((lon) => {
            const start = project(80, lon);
            const end = project(-80, lon);
            return <line key={`lon-${lon}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#d7d7d2" strokeWidth="1" />;
          })}
        {landOutlines.map((outline, index) => (
          <polyline key={`land-${index}`} points={polylinePoints(outline).join(" ")} fill="none" stroke="#73736d" strokeWidth="1.7" strokeLinejoin="round" />
        ))}
        {routes.map((route) => (
          <polyline key={route.name} points={polylinePoints(route.coordinates).join(" ")} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
        ))}
        {zones.map((zone) => (
          <polygon key={zone.name} points={polylinePoints(zone.coordinates).join(" ")} fill="rgba(180,83,9,0.12)" stroke="#b45309" strokeWidth="2" />
        ))}
        {showHeat &&
          mapSignals.map((node, index) => {
            const point = project(node.lat, node.lon);
            return <circle key={`heat-${node.lat}-${node.lon}-${index}`} cx={point.x} cy={point.y} r={18 + node.intensity * 26} fill="url(#projectionHeat)" opacity="0.9" />;
          })}
        {showNodes &&
          ambientSignals.map((node, index) => {
            const point = project(node.lat, node.lon);
            return <circle key={`ambient-node-${node.lat}-${node.lon}-${index}`} cx={point.x} cy={point.y} r="4.5" fill="#5b21b6" stroke="#fff" strokeWidth="1.5" />;
          })}
        {showNodes &&
          nodes.map((node) => {
            const point = project(node.lat, node.lon);
            const selected = node.title === selectedNodeTitle;
            return (
              <g
                key={`node-${node.title}`}
                className="cursor-pointer outline-none"
                role="button"
                tabIndex={0}
                aria-label={`Open ${node.title}`}
                onClick={() => onSelectNode(node.title)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectNode(node.title);
                  }
                }}
              >
                <circle cx={point.x} cy={point.y} r={selected ? 7 : 5} fill={selected ? "#171717" : "#5b21b6"} stroke="#fff" strokeWidth="1.8" />
                <circle cx={point.x} cy={point.y} r="14" fill="transparent" />
              </g>
            );
          })}
        {showLabels &&
          nodes.slice(0, 6).map((node) => {
            const point = project(node.lat, node.lon);
            return (
              <text key={`label-${node.title}`} x={point.x + 8} y={point.y - 8} fill="#171717" fontSize="13" fontFamily="Inter, system-ui">
                {node.title}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

function MapPopup({ node, onClose }: { node: KnowledgeNode; onClose: () => void }) {
  const popupPosition = node.popupClassName === "hidden" ? "right-[18%] top-[40%] w-[270px]" : node.popupClassName;

  return (
    <article className={`absolute z-20 rounded-lg border border-neutral-200 bg-white/92 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur ${popupPosition}`}>
      <button type="button" className="absolute right-2 top-2 text-neutral-500 hover:text-neutral-950" onClick={onClose} aria-label={`Close ${node.title} preview`}>
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex gap-3 pr-4">
        <Image src={node.image} alt="" width={86} height={72} className="h-[72px] w-[86px] rounded-md object-cover" />
        <div className="pt-1">
          <h3 className="text-sm font-semibold text-neutral-950">{node.title}</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-700">{node.place}</p>
          <p className="text-xs leading-5 text-neutral-700">{node.time}</p>
        </div>
      </div>
    </article>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" className="flex items-center justify-between text-sm text-neutral-800" onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full ${checked ? "bg-blue-700" : "bg-neutral-300"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm ${checked ? "right-0.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function KnowledgeMapStage() {
  const [mode, setMode] = useState<ViewMode>("globe");
  const [showHeat, setShowHeat] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [timePeriod, setTimePeriod] = useState("All time");
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [selectedNodeTitle, setSelectedNodeTitle] = useState<string | null>(nodes[0].title);
  const query = "battle AND ww2 AND deaths > 10000";

  const nodeCount = useMemo(() => nodes.length + routes.length + zones.length, []);
  const selectedNode = useMemo(() => nodes.find((node) => node.title === selectedNodeTitle) ?? null, [selectedNodeTitle]);
  const zoomBounds = zoomBoundsForMode(mode);
  const canZoomIn = zoom < zoomBounds.max;
  const canZoomOut = zoom > zoomBounds.min;

  const selectNode = useCallback((title: string) => {
    setSelectedNodeTitle(title);
  }, []);

  const zoomIn = () => setZoom((current) => Math.min(zoomBounds.max, Number((current + zoomBounds.step).toFixed(2))));
  const zoomOut = () => setZoom((current) => Math.max(zoomBounds.min, Number((current - zoomBounds.step).toFixed(2))));
  const setViewMode = (nextMode: ViewMode) => {
    const nextBounds = zoomBoundsForMode(nextMode);
    setMode(nextMode);
    setZoom((current) => Math.min(nextBounds.max, Math.max(nextBounds.min, current)));
  };

  const locateNearestNode = useCallback(() => {
    const fallback = () => {
      setSelectedNodeTitle("Silicon Valley AI Cluster");
      setZoom(1.35);
    };

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nodes.reduce(
          (best, node) => {
            const distance = Math.hypot(node.lat - position.coords.latitude, node.lon - position.coords.longitude);
            return distance < best.distance ? { distance, title: node.title } : best;
          },
          { distance: Number.POSITIVE_INFINITY, title: nodes[0].title }
        );
        setSelectedNodeTitle(nearest.title);
        setZoom(1.35);
      },
      fallback,
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 6000 }
    );
  }, []);

  return (
    <div className="relative h-[calc(100vh-92px)] min-h-[760px]">
      {mode === "globe" ? (
        <ThreeGlobe showHeat={showHeat} showNodes={showNodes} showBorders={showBorders} selectedNodeTitle={selectedNodeTitle} zoom={zoom} onSelectNode={selectNode} />
      ) : (
        <ProjectionMap showHeat={showHeat} showNodes={showNodes} showBorders={showBorders} showLabels={showLabels} selectedNodeTitle={selectedNodeTitle} zoom={zoom} onSelectNode={selectNode} />
      )}

      <div className="absolute left-7 top-[12%] z-20 grid gap-3">
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/88 text-neutral-950 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur" aria-label="Home">
          <Home className="h-5 w-5" />
        </Link>
        <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white/88 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur">
          <button type="button" className="flex h-12 w-12 items-center justify-center border-b border-neutral-200 disabled:cursor-not-allowed disabled:opacity-40" onClick={zoomIn} disabled={!canZoomIn} aria-label="Zoom in">
            <Plus className="h-5 w-5" />
          </button>
          <button type="button" className="flex h-12 w-12 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40" onClick={zoomOut} disabled={!canZoomOut} aria-label="Zoom out">
            <Minus className="h-5 w-5" />
          </button>
        </div>
        <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/88 text-neutral-950 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur" onClick={locateNearestNode} aria-label="Locate nearest node">
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      <aside className="absolute right-6 top-7 z-20 w-[214px] rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.1)] backdrop-blur">
        <div className="border-b border-neutral-200 pb-4">
          <p className="text-xs text-neutral-700">Time period</p>
          <button type="button" className="mt-4 flex w-full items-center justify-between text-sm text-neutral-950" onClick={() => setTimeMenuOpen((open) => !open)} aria-expanded={timeMenuOpen}>
            {timePeriod}
            <ChevronDown className={`h-4 w-4 transition-transform ${timeMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {timeMenuOpen && (
            <div className="mt-3 grid overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-sm">
              {["All time", "Ancient", "Modern", "20th century"].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`px-3 py-2 text-left hover:bg-neutral-100 ${period === timePeriod ? "font-medium text-neutral-950" : "text-neutral-700"}`}
                  onClick={() => {
                    setTimePeriod(period);
                    setTimeMenuOpen(false);
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-b border-neutral-200 py-4">
          <p className="text-xs text-neutral-700">View mode</p>
          <div className="mt-3 grid grid-cols-2 rounded-md border border-neutral-200 bg-neutral-100 p-1 text-xs">
            <button type="button" className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 ${mode === "globe" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-600"}`} onClick={() => setViewMode("globe")}>
              <Globe2 className="h-3.5 w-3.5" />
              3D
            </button>
            <button type="button" className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 ${mode === "projection" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-600"}`} onClick={() => setViewMode("projection")}>
              <MapIcon className="h-3.5 w-3.5" />
              2D
            </button>
          </div>
        </div>
        <div className="pt-5">
          <p className="text-xs text-neutral-700">View options</p>
          <div className="mt-4 grid gap-4">
            <Toggle label="Heatmap" checked={showHeat} onChange={setShowHeat} />
            <Toggle label="Nodes" checked={showNodes} onChange={setShowNodes} />
            <Toggle label="Borders" checked={showBorders} onChange={setShowBorders} />
            <Toggle label="Labels" checked={showLabels} onChange={setShowLabels} />
          </div>
        </div>
      </aside>

      {selectedNode && <MapPopup node={selectedNode} onClose={() => setSelectedNodeTitle(null)} />}

      <div className="absolute bottom-14 left-7 z-20 rounded-xl border border-neutral-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.1)] backdrop-blur">
        <div className="flex items-center gap-4 text-sm text-neutral-800">
          <span className="h-2 w-2 rounded-full bg-violet-700 shadow-[0_0_0_2px_rgba(91,33,182,0.12)]" />
          Knowledge node
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-neutral-800">
          <span
            className="h-6 w-6 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(239,68,68,0.95) 0 16%, rgba(250,204,21,0.9) 34%, rgba(34,211,238,0.65) 58%, rgba(59,130,246,0.18) 78%)"
            }}
          />
          High density area
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-neutral-800">
          <span className="h-px w-6 bg-blue-700" />
          Line or polygon entry
        </div>
      </div>

      <div className="absolute bottom-12 right-6 z-20 flex max-w-[520px] flex-wrap items-center justify-end gap-3">
        <div className="hidden rounded-full border border-neutral-200 bg-white/92 px-5 py-3 text-xs text-neutral-600 shadow-[0_14px_30px_rgba(0,0,0,0.09)] backdrop-blur xl:block">
          {nodeCount} entries · <span className="font-mono text-neutral-950">{query}</span>
        </div>
        <Link href={`/map?q=${encodeURIComponent(query)}`} className="flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-white/92 px-5 text-sm text-neutral-950 shadow-[0_14px_30px_rgba(0,0,0,0.09)] backdrop-blur">
          <Search className="h-5 w-5" />
          Search
        </Link>
        <Link href="/map" className="flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-white/92 px-5 text-sm text-neutral-950 shadow-[0_14px_30px_rgba(0,0,0,0.09)] backdrop-blur">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </Link>
      </div>
    </div>
  );
}
