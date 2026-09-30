#!/bin/zsh

git branch --merged|egrep -v '\*|develop|main|master'|xargs git branch -d
git config --global --add --bool push.autoSetupRemote true
git config --global --add safe.directory /home/vscode/app
git config --global --unset commit.template
git config --global fetch.prune true
git config --global tag.gpgsign false
git config --global commit.gpgsign false
[ -f .envrc ] && direnv allow || true

# GITHUB_TOKEN comes from remoteEnv, but that only propagates if the host
# shell actually exported it. Fall back to gh's own cached token so bun
# install/update against GitHub Packages doesn't 401 when the host forgot.
[ -z "$GITHUB_TOKEN" ] && command -v gh >/dev/null 2>&1 \
  && export GITHUB_TOKEN="$(gh auth token 2>/dev/null)" || true
grep -q 'GITHUB_TOKEN.*gh auth token' ~/.zshrc 2>/dev/null || cat >>~/.zshrc <<'EOF'

[ -z "$GITHUB_TOKEN" ] && command -v gh >/dev/null 2>&1 && export GITHUB_TOKEN="$(gh auth token 2>/dev/null)"
EOF

# Codex reads credentials from auth.json, not from OPENAI_API_KEY, so the
# variable alone leaves the TUI sitting on its sign-in screen. Log in once,
# with the key piped over stdin so it never shows up in ps.
[ -n "$OPENAI_API_KEY" ] && command -v codex >/dev/null 2>&1 \
  && { codex login status >/dev/null 2>&1 \
    || printenv OPENAI_API_KEY | codex login --with-api-key; } || true
