# generate_helm_values.py

import os
import yaml

services = ["gatewayApp", "studentApp", "gradeApp", "courseApp"]
helm_dir = os.path.join(os.path.dirname(__file__), "..", "helm")

base_ports = {
    "APP": 8080,
    "DB": 5430,
    "NODEPORT": 30000
}

for idx, service in enumerate(services):
    service_kebab = service.replace("App", "app").lower()
    values_path = os.path.join(helm_dir, service_kebab, "values.yaml")
    os.makedirs(os.path.dirname(values_path), exist_ok=True)

    values = {
        "app": {
            "name": service,
            "port": base_ports["APP"] + idx,
            "image": f"{service.lower()}-dev-image"
        },
        "db": {
            "port": base_ports["DB"] + idx
        },
        "service": {
            "nodePort": base_ports["NODEPORT"] + idx
        }
    }

    with open(values_path, "w") as f:
        yaml.dump(values, f, default_flow_style=False)

print("✅ Helm values.yaml files generated for all services.")

