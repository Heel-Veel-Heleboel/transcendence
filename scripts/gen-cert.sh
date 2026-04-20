#!/usr/bin/env bash
# Generate a self-signed TLS certificate for the project.
#
# Uses the machine's hostname by default — resolvable via school/LAN DNS
# without requiring /etc/hosts changes or admin rights.
#
# Usage:
#   bash scripts/gen-cert.sh           # uses $(hostname)
#   bash scripts/gen-cert.sh myhostname
#
# Output: certs/server.crt  certs/server.key

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$CERT_DIR"

# ── Resolve hostname ───────────────────────────────────────────────────────────
HOST="${1:-$(hostname)}"

echo "Generating cert for: $HOST (+ localhost / 127.0.0.1)"

# RSA 2048 — universally supported by nginx, all browsers, and both OpenSSL and LibreSSL.
# (Ed25519 certificates cause TLS handshake failures with nginx:alpine's OpenSSL build.)
openssl req -x509 -newkey rsa:2048 -days 3650 \
  -noenc \
  -keyout "$CERT_DIR/server.key" \
  -out    "$CERT_DIR/server.crt" \
  -subj   "/CN=$HOST" \
  -addext "subjectAltName=DNS:$HOST,DNS:localhost,IP:127.0.0.1"

echo "Done."
echo "  $CERT_DIR/server.crt"
echo "  $CERT_DIR/server.key"
echo ""
echo "Remote players connect to: https://$HOST:7140"
echo "Accept the self-signed certificate warning to continue."
