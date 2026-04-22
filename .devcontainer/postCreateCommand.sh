#!/bin/zsh

sudo chown -R vscode:vscode public
sudo chown -R vscode:vscode node_modules
bun install --frozen-lockfile --ignore-scripts
bunx --bun @biomejs/biome migrate --write
bunx playwright instal
