#!/usr/bin/env bash

set -euo pipefail

REMOTE_HOST="${DEPLOY_HOST:-}"
REMOTE_USER="${DEPLOY_USER:-root}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/admin-prototype-system}"
SSH_PORT="${DEPLOY_PORT:-22}"

if [[ -z "${REMOTE_HOST}" ]]; then
  echo "DEPLOY_HOST is required"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "Building production bundle..."
npm run build

echo "Ensuring remote directory exists..."
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p '${REMOTE_PATH}'"

echo "Uploading dist/ to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}..."
rsync -av --delete -e "ssh -p ${SSH_PORT}" "${PROJECT_ROOT}/dist/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "Deployment finished."
