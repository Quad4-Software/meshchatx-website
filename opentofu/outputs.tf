output "site_url" {
  value       = "http://${var.host}:${var.port}"
  description = "Static site URL"
}

output "api_url" {
  value       = var.enable_api ? "http://${var.host}:${var.api_port}" : null
  description = "Site API URL when enable_api is true"
}
