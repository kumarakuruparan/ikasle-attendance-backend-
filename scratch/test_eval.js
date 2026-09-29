const path = require('path');

// Dynamically import or require compiled/ts node
const frontendRoot = path.resolve(__dirname, '../../frontend');

// Load files manually to verify logic
const { PERMISSIONS, ROLE_PERMISSIONS } = require(path.join(frontendRoot, 'lib', 'auth', 'permissions.ts'));
const { ROLES, ROLE_METADATA } = require(path.join(frontendRoot, 'lib', 'auth', 'roles.ts'));
const { hasPermission, hasRole, isRouteAllowed, getRoleDefaultPath } = require(path.join(frontendRoot, 'lib', 'auth', 'access.ts'));
