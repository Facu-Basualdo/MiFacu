const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 1. Find the project and workspace directories
const projectRoot = path.resolve(__dirname, 'frontend');
const workspaceRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 2. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 3. Let Metro look in the root node_modules and the frontend node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
