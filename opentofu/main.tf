locals {
  dist_path = var.dist_path != "" ? abspath(var.dist_path) : abspath("${path.module}/../dist")
}

resource "docker_image" "site" {
  name         = "meshchatx-web:local"
  keep_locally = true

  build {
    context    = abspath("${path.module}/..")
    dockerfile = "Dockerfile"
    target     = "runtime"
  }
}

resource "docker_image" "siteapi" {
  count        = var.enable_api ? 1 : 0
  name         = "meshchatx-siteapi:local"
  keep_locally = true

  build {
    context    = abspath("${path.module}/../api")
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "site" {
  name      = "meshchatx-web"
  image     = docker_image.site.image_id
  restart   = "unless-stopped"
  read_only = true

  security_opts = ["no-new-privileges:true"]

  capabilities {
    drop = ["ALL"]
  }

  ports {
    ip       = var.host
    internal = 8080
    external = var.port
    protocol = "tcp"
  }

  volumes {
    host_path      = local.dist_path
    container_path = "/var/www/html"
    read_only      = true
  }

  volumes {
    host_path      = abspath("${path.module}/../docker/lighttpd.conf")
    container_path = "/etc/lighttpd/lighttpd.conf"
    read_only      = true
  }

  tmpfs = {
    "/tmp" = "noexec,nosuid,size=8m"
  }

  log_driver = "json-file"
  log_opts = {
    max-size = "10m"
    max-file = "5"
  }
}

resource "docker_container" "siteapi" {
  count     = var.enable_api ? 1 : 0
  name      = "meshchatx-siteapi"
  image     = docker_image.siteapi[0].image_id
  restart   = "unless-stopped"
  read_only = true
  user      = "65532:65532"

  security_opts = ["no-new-privileges:true"]

  capabilities {
    drop = ["ALL"]
  }

  ports {
    ip       = var.host
    internal = 8090
    external = var.api_port
    protocol = "tcp"
  }

  env = [
    "ADDR=:8090",
    "CDN_BASE=${var.cdn_base}",
    "BUNNY_STORAGE_ZONE=${var.bunny_storage_zone}",
    "BUNNY_STORAGE_ENDPOINT=${var.bunny_storage_endpoint}",
    "BUNNY_STORAGE_ACCESS_KEY=${var.bunny_storage_access_key}",
  ]

  tmpfs = {
    "/tmp" = "noexec,nosuid,size=8m"
  }

  log_driver = "json-file"
  log_opts = {
    max-size = "10m"
    max-file = "5"
  }
}
