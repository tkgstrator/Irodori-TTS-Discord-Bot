#!/bin/zsh

sudo chown -R $(whoami):$(whoami) node_modules
bun install --frozen-lockfile --ignore-scripts
bunx --bun @biomejs/biome migrate --write
bunx playwright install
sudo bunx playwright install-deps
