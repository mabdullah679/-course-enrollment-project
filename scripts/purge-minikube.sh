#!/bin/bash

echo "💣 Nuking Docker + Minikube state..."

# Quit Docker Desktop
osascript -e 'quit app "Docker Desktop"'
sleep 3

# Kill any Docker processes
sudo pkill -9 Docker || true
sudo pkill -9 docker || true

# Remove Minikube container + volume
echo "🧼 Cleaning Minikube container and volume..."
docker rm -f minikube 2>/dev/null || echo "🟢 No minikube container"
docker volume rm minikube 2>/dev/null || echo "🟢 No minikube volume"

# Remove Minikube images
echo "🧼 Removing stale minikube images..."
docker rmi $(docker images | grep minikube | awk '{print $3}') 2>/dev/null || echo "🟢 No minikube images"

# Delete local config
echo "🧹 Removing ~/.minikube..."
rm -rf ~/.minikube

# Restart Docker Desktop
echo "🔁 Restarting Docker..."
open -a "Docker"
echo "⏳ Waiting for Docker to be ready..."
until docker ps > /dev/null 2>&1; do sleep 1; done

# Start Minikube
echo "🚀 Starting Minikube..."
minikube start --memory=4g --cpus=2
