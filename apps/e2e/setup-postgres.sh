#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql
sudo service postgresql start
sudo -u postgres psql --command "ALTER USER postgres WITH PASSWORD 'postgres';"

if ! sudo -u postgres psql --tuples-only --no-align --command \
  "SELECT 1 FROM pg_database WHERE datname = 'metro_atlanta_saves'" | grep -q 1; then
  sudo -u postgres createdb --owner=postgres metro_atlanta_saves
fi
