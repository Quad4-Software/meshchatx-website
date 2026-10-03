variable "dist_path" {
  type        = string
  default     = ""
  description = "Host path to the Astro dist directory. Empty uses ../dist next to this module."
}

variable "host" {
  type        = string
  default     = "127.0.0.1"
  description = "Host address that publishes the site and API ports"
}

variable "port" {
  type        = number
  default     = 8080
  description = "Host port for the static site"
}

variable "api_port" {
  type        = number
  default     = 8090
  description = "Host port for the site API"
}

variable "bunny_storage_access_key" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Bunny Storage AccessKey. When set the site API lists the zone and prefers CDN download URLs."
}

variable "bunny_storage_zone" {
  type        = string
  default     = "quad4"
  description = "Bunny Storage zone name"
}

variable "bunny_storage_endpoint" {
  type        = string
  default     = "https://ny.storage.bunnycdn.com"
  description = "Bunny Storage API endpoint"
}

variable "cdn_base" {
  type        = string
  default     = "https://cdn.quad4.io"
  description = "Public CDN base used for rewritten download URLs"
}
