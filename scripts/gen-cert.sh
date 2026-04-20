#!/usr/bin/env bash
# Generate a self-signed TLS certificate with Subject Alternative Names for
# the project hostname, localhost, and the machine's LAN IP.
#
# Usage:
#   bash scripts/gen-cert.sh [IP]
#
# If IP is omitted, the script detects the primary LAN IP automatically.
# Output: certs/server.crt  certs/server.key

HOSTNAME="transcendence-avs"

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$CERT_DIR"

# ── Resolve IP ────────────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  HOST_IP="$1"
else
  # Works on Linux (school iMacs) and macOS
  if command -v ip &>/dev/null; then
    HOST_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
  else
    HOST_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
  fi
fi

if [ -z "${HOST_IP:-}" ]; then
  echo "ERROR: Could not detect LAN IP. Pass it explicitly: bash scripts/gen-cert.sh 10.x.x.x"
  exit 1
fi

echo "Generating cert for: $HOSTNAME / $HOST_IP  (+ localhost / 127.0.0.1)"

# RSA 2048 — universally supported by nginx, all browsers, and both OpenSSL and LibreSSL.
# (Ed25519 certificates cause TLS handshake failures with nginx:alpine's OpenSSL build.)
# Source: https://stackoverflow.com/a/41366949 (vog, CC BY-SA 4.0)
openssl req -x509 -newkey rsa:2048 -days 3650 \
  -noenc \
  -keyout "$CERT_DIR/server.key" \
  -out    "$CERT_DIR/server.crt" \
  -subj   "/CN=$HOSTNAME" \
  -addext "subjectAltName=DNS:$HOSTNAME,DNS:localhost,IP:127.0.0.1,IP:$HOST_IP"

echo "Done."
echo "  $CERT_DIR/server.crt"
echo "  $CERT_DIR/server.key"
echo ""
echo "Ensure '$HOSTNAME' resolves on every machine that will connect:"
echo "  Host machine : echo '127.0.0.1  $HOSTNAME' | sudo tee -a /etc/hosts"
echo "  Remote player: echo '$HOST_IP  $HOSTNAME' | sudo tee -a /etc/hosts"
echo ""
echo "Then open: https://$HOSTNAME"
echo "Accept the self-signed certificate warning to continue."
