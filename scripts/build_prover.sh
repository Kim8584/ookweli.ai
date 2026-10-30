#!/usr/bin/env bash
set -e
echo "Building Jolt Atlas zkML prover binary from source..."
if [ ! -d "/tmp/jolt-atlas" ]; then
  git clone --depth 1 https://github.com/ICME-Lab/jolt-atlas.git /tmp/jolt-atlas
fi
cd /tmp/jolt-atlas
cargo build --release -p jolt-atlas-core --example prove
mkdir -p "$OLDPWD/bin"
cp target/release/examples/prove "$OLDPWD/bin/jolt-atlas-prover"
echo "Build complete: bin/jolt-atlas-prover is ready."
