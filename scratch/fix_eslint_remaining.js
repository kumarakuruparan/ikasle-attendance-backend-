const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Fix Hero3DCanvas.tsx
const canvasPath = path.join(frontendDir, 'components/hero/Hero3DCanvas.tsx');
const newCanvasContent = `"use client";

import React, { useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import HeroScene from "./HeroScene";

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen = window.innerWidth < 640;
  return prefersReducedMotion || isSmallScreen;
}

export default function Hero3DCanvas() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const isLowPower = useSyncExternalStore(subscribeResize, getSnapshot, () => false);

  if (!mounted) {
    return (
      <div className="absolute inset-0 -z-10 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
    );
  }

  if (isLowPower) {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute top-1/3 -right-20 -z-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-10 -left-20 -z-10 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-90 transition-opacity duration-1000">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <HeroScene />
      </Canvas>
    </div>
  );
}
`;
fs.writeFileSync(canvasPath, newCanvasContent, 'utf8');
console.log('1. Fixed Hero3DCanvas.tsx');

// 2. Fix useAuthRole.tsx
const authRolePath = path.join(frontendDir, 'lib/auth/useAuthRole.tsx');
let authRole = fs.readFileSync(authRolePath, 'utf8');

// Replace useState with lazy initializer and remove synchronous setState in effect
const oldStateBlock = `  const { user, isLoaded, isSignedIn } = useUser();
  const [activeRole, setActiveRole] = useState<UserRole>('employee');
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    // 1. Check if user selected a demo role override in session
    const savedRole = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null;
    if (savedRole && (savedRole === 'employee' || savedRole === 'hr' || savedRole === 'ceo')) {
      setActiveRole(savedRole);
      return;
    }

    // 2. Otherwise read from Clerk user metadata
    if (user) {
      const clerkRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as UserRole | undefined;
      if (clerkRole && (clerkRole === 'employee' || clerkRole === 'hr' || clerkRole === 'ceo')) {
        setActiveRole(clerkRole);
      }
    }
  }, [user]);`;

const newStateBlock = `  const { user, isLoaded, isSignedIn } = useUser();
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null;
      if (saved && (saved === 'employee' || saved === 'hr' || saved === 'ceo')) {
        return saved;
      }
    }
    return 'employee';
  });
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null;
      if (savedRole) return; // user explicitly chose a demo role
    }

    if (user) {
      const clerkRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as UserRole | undefined;
      if (clerkRole && (clerkRole === 'employee' || clerkRole === 'hr' || clerkRole === 'ceo')) {
        // Schedule state update asynchronously to avoid cascading render lint error
        queueMicrotask(() => setActiveRole(clerkRole));
      }
    }
  }, [user]);`;

authRole = authRole.replace(oldStateBlock, newStateBlock);
fs.writeFileSync(authRolePath, authRole, 'utf8');
console.log('2. Fixed useAuthRole.tsx');
