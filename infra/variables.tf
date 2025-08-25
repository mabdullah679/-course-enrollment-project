variable "cloud_provider" { type = string }
variable "deploy_type"    { type = string }
variable "env"            { type = string }
variable "budget_profile" { type = string }
variable "region"         { type = string }
variable "name_prefix"    { type = string }
variable "runtime"        { type = string }
variable "memory"         { type = number }
variable "timeout_seconds"{ type = number }
variable "min_scale"      { type = number }
variable "max_scale"      { type = number }
variable "db_engine"      { type = string }
variable "nosql_table_or_collection" { type = string }
variable "use_api_gateway" { type = bool }
variable "enable_cors"     { type = bool }
variable "allowed_origins" { type = list(string) }
variable "tags"            { type = map(string) }
variable "ttl_hours"       { type = number }

variable "log_retention_days" {
  description = "Retention days for Lambda logs"
  type        = number
  default     = 14
}

variable "allow_paid" {
  description = "Allow resources beyond free tier"
  type        = bool
  default     = false
}

variable "public_access" {
  description = "Public Lambda URL access"
  type        = bool
  default     = false
}

# Important for provider binding
variable "profile" {
  description = "AWS CLI profile"
  type        = string
  default     = "aws-cli-client"
}
