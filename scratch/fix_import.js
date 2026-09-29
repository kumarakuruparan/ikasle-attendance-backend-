const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../frontend/lib/auth/useAuthRole.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(
  "import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';",
  "import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from 'react';"
);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Added useSyncExternalStore import to useAuthRole.tsx');
