const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Fix Hero3DCanvas.tsx
const canvasPath = path.join(frontendDir, 'components/hero/Hero3DCanvas.tsx');
let canvasContent = fs.readFileSync(canvasPath, 'utf8');
canvasContent = canvasContent.replace(
  'import React, { useState, useEffect } from "react";',
  'import React, { useState, useEffect, useSyncExternalStore } from "react";'
);
canvasContent = canvasContent.replace(
  '  const [mounted, setMounted] = useState(false);',
  '  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);'
);
canvasContent = canvasContent.replace(
  '    setMounted(true);\n',
  ''
);
fs.writeFileSync(canvasPath, canvasContent, 'utf8');
console.log('1. Fixed Hero3DCanvas.tsx');

// 2. Fix HeroScene.tsx
const scenePath = path.join(frontendDir, 'components/hero/HeroScene.tsx');
let sceneContent = fs.readFileSync(scenePath, 'utf8');

const oldDataParticles = `function DataParticles({ count = 45 }: { count?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return p;
  }, [count]);`;

const newDataParticles = `function pseudoRandom(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function DataParticles({ count = 45 }: { count?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (pseudoRandom(i, 1) - 0.5) * 16;
      p[i * 3 + 1] = (pseudoRandom(i, 2) - 0.5) * 10;
      p[i * 3 + 2] = (pseudoRandom(i, 3) - 0.5) * 8 - 2;
    }
    return p;
  }, [count]);`;

sceneContent = sceneContent.replace(oldDataParticles, newDataParticles);
fs.writeFileSync(scenePath, sceneContent, 'utf8');
console.log('2. Fixed HeroScene.tsx');

// 3. Fix useAuthRole.tsx
const authRolePath = path.join(frontendDir, 'lib/auth/useAuthRole.tsx');
let authRoleContent = fs.readFileSync(authRolePath, 'utf8');
authRoleContent = authRoleContent.replace(
  "import React, { createContext, useContext, useState, useEffect } from 'react';",
  "import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';"
);
authRoleContent = authRoleContent.replace(
  '  const [mounted, setMounted] = useState(false);',
  '  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);'
);
authRoleContent = authRoleContent.replace(
  '    setMounted(true);\n',
  ''
);
fs.writeFileSync(authRolePath, authRoleContent, 'utf8');
console.log('3. Fixed useAuthRole.tsx');
