const HUB_IMAGE = "quad4io/meshchatx:latest";
const GHCR_IMAGE = "ghcr.io/quad4-software/meshchatx:latest";

export const COMPOSE_YAML = `services:
    reticulum-meshchatx:
        container_name: reticulum-meshchatx
        image: \${MESHCHAT_IMAGE:-quad4io/meshchatx:latest}
        restart: unless-stopped
        security_opt:
            - no-new-privileges:true
        ports:
            - 127.0.0.1:8000:8000
        volumes:
            - meshchatx-config:/config

volumes:
    meshchatx-config:
        name: meshchatx-config`;

export function containerPullCmd(
  engine: "docker" | "podman",
  registry: "hub" | "ghcr",
): string {
  const image = registry === "ghcr" ? GHCR_IMAGE : HUB_IMAGE;
  return `${engine} pull ${image}`;
}

export function containerRunCmd(engine: "docker" | "podman"): string {
  return (
    `${engine} run -d --name reticulum-meshchatx \\\n` +
    "  --restart unless-stopped \\\n" +
    "  --security-opt no-new-privileges:true \\\n" +
    "  -p 127.0.0.1:8000:8000 \\\n" +
    "  -v meshchatx-config:/config \\\n" +
    `  ${HUB_IMAGE}`
  );
}
