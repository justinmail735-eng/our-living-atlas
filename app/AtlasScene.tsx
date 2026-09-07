'use client';
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  Vector3,
} from 'three';
const points: [number, number, number][] = [
  [-2.3, 0.3, 0.3],
  [-1.1, 0.85, -0.3],
  [0.1, 0.35, 0.4],
  [1.1, 0.7, -0.2],
  [2.1, 0.2, 0.35],
];
function Terrain() {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new BufferGeometry(),
      vertices: number[] = [];
    const segments = 80;
    for (let r = 0; r < 22; r++) {
      const inner = r * 0.13,
        outer = (r + 1) * 0.13;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2,
          b = ((i + 1) / segments) * Math.PI * 2;
        const h = (x: number, z: number) =>
          Math.sin(x * 2.4) * 0.08 +
          Math.cos(z * 2.8) * 0.07 +
          Math.sin((x + z) * 3) * 0.03;
        vertices.push(
          inner * Math.cos(a),
          h(inner * Math.cos(a), inner * Math.sin(a)),
          inner * Math.sin(a),
          outer * Math.cos(a),
          h(outer * Math.cos(a), outer * Math.sin(a)),
          outer * Math.sin(a),
          outer * Math.cos(b),
          h(outer * Math.cos(b), outer * Math.sin(b)),
          outer * Math.sin(b),
          inner * Math.cos(a),
          h(inner * Math.cos(a), inner * Math.sin(a)),
          inner * Math.sin(a),
          outer * Math.cos(b),
          h(outer * Math.cos(b), outer * Math.sin(b)),
          outer * Math.sin(b),
          inner * Math.cos(b),
          h(inner * Math.cos(b), inner * Math.sin(b)),
          inner * Math.sin(b),
        );
      }
    }
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  useFrame((_, d) => {
    if (mesh.current) mesh.current.rotation.y += d * 0.035;
  });
  return (
    <mesh ref={mesh} geometry={geometry} rotation={[-0.18, 0, 0.05]}>
      <meshStandardMaterial
        color="#0a2130"
        roughness={0.48}
        metalness={0.5}
        wireframe
        side={DoubleSide}
      />
    </mesh>
  );
}
function RouteLine() {
  const geometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        new CatmullRomCurve3(points.map((p) => new Vector3(...p))).getPoints(
          100,
        ),
      ),
    [],
  );
  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#59cbef"
        transparent
        opacity={0.48}
        blending={AdditiveBlending}
      />
    </line>
  );
}
function Beacons({ active, colors }: { active: number; colors: string[] }) {
  const group = useRef<Group>(null);
  useFrame((s) => {
    if (group.current)
      group.current.position.y = Math.sin(s.clock.elapsedTime * 0.35) * 0.035;
  });
  return (
    <group ref={group}>
      {points.map((p, i) => (
        <group position={p} key={i}>
          <mesh>
            <sphereGeometry args={[i === active ? 0.105 : 0.055, 24, 24]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={new Color(colors[i])}
              emissiveIntensity={i === active ? 5 : 0.5}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.55, 8]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={0.55} />
          </mesh>
          {i === active && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
              <ringGeometry args={[0.18, 0.21, 48]} />
              <meshBasicMaterial
                color={colors[i]}
                transparent
                opacity={0.7}
                side={DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
function Scene({ active, colors }: { active: number; colors: string[] }) {
  return (
    <>
      <color attach="background" args={['#03090e']} />
      <fog attach="fog" args={['#03090e', 5.5, 11]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 5, 4]} intensity={2.2} color="#9adfff" />
      <Float speed={0.55} rotationIntensity={0.08} floatIntensity={0.12}>
        <group rotation={[-0.22, -0.18, 0]} scale={1.28}>
          <Terrain />
          <RouteLine />
          <Beacons active={active} colors={colors} />
        </group>
      </Float>
      <OrbitControls
        enablePan={false}
        minDistance={5.5}
        maxDistance={8}
        minPolarAngle={0.65}
        maxPolarAngle={1.4}
      />
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={1}
          luminanceSmoothing={0.45}
          intensity={1.15}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
        <ToneMapping />
      </EffectComposer>
    </>
  );
}
export default function AtlasScene({
  active,
  colors,
}: {
  active: number;
  colors: string[];
}) {
  return (
    <div className="scene-canvas">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 3.7, 6.2], fov: 43 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene active={active} colors={colors} />
        </Suspense>
      </Canvas>
    </div>
  );
}
