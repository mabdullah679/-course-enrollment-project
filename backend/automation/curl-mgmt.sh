#!/bin/bash

declare -A services=(
  [studentApp]=8081
)

echo "🔍 Checking service health statuses..."

for service in "${!services[@]}"; do
  port=${services[$service]}
  minikube_ip=$(minikube ip)
  response=$(curl -s -o /dev/null -w "%{http_code}" http://$minikube_ip:$port/actuator/health)

  if [ "$response" == "200" ]; then
    status="🟢 UP"
  else
    status="🔴 DOWN (HTTP $response)"
  fi

  echo "service: $service    port: $port    status: $status"
done