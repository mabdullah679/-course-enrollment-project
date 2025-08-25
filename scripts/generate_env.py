# generate_env.py

services = ["gatewayApp", "studentApp", "gradeApp", "courseApp"]
env_file = ".env"

base_ports = {
    "APP": 8080,
    "DB": 5430,
    "NODEPORT": 30000,
    "LOCALHOST": 8000
}

with open(env_file, "w") as f:
    f.write("# ─── Generated Environment Variables ───\n")

    for idx, service in enumerate(services):
        upper = service.upper()

        app_port = base_ports["APP"] + idx
        db_port = base_ports["DB"] + idx
        node_port = base_ports["NODEPORT"] + idx
        localhost_port = base_ports["LOCALHOST"] + idx

        f.write(f"{upper}_PORT={app_port}\n")
        f.write(f"{upper}_DB_PORT={db_port}\n")
        f.write(f"{upper}_NODEPORT={node_port}\n")
        f.write(f"{upper}_LOCALHOST={localhost_port}\n\n")

    f.write("# ─── Image Tags ───\n")
    for service in services:
        upper = service.upper()
        f.write(f"{upper}_IMAGE={service.lower()}-dev-image\n")

    f.write("\nSPRING_PROFILES_ACTIVE=dev\n")

