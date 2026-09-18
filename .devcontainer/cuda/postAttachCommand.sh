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

# Codex ignores model_provider / model_providers in a project-local .codex/config.toml,
# so an OpenAI-compatible endpoint only takes effect from the user-level config.
write_codex_provider() {
  [ -n "$OPENAI_BASE_URL" ] && [ -n "$CODEX_HOME" ] || return 0
  cfg="$CODEX_HOME/config.toml"
  grep -q '^model_provider[[:space:]]*=' "$cfg" 2>/dev/null && return 0
  mkdir -p "$CODEX_HOME" || return 1
  {
    printf 'model_provider = "compat"\n\n'
    [ -f "$cfg" ] && cat "$cfg"
    printf '\n[model_providers.compat]\nname = "compat"\nbase_url = "%s"\nenv_key = "OPENAI_API_KEY"\nwire_api = "responses"\n' "$OPENAI_BASE_URL"
  } >"$cfg.tmp" && chmod 600 "$cfg.tmp" && mv "$cfg.tmp" "$cfg"
}
write_codex_provider || true
