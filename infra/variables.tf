variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "profile" {
  description = "AWS CLI/SDK profile to use"
  type        = string
  default     = "default"
}

variable "name_prefix" {
  description = "Prefix used to name resources"
  type        = string
  default     = "cegm"
}

variable "env" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "memory" {
  description = "Lambda memory (MB)"
  type        = number
  default     = 256
}

variable "timeout_seconds" {
  description = "Lambda timeout seconds"
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention days"
  type        = number
  default     = 7
}

variable "public_access" {
  description = "If true, Lambda URL is public"
  type        = bool
  default     = false
}

variable "nosql_table_or_collection" {
  description = "DynamoDB table name"
  type        = string
  default     = "cegm-events"
}

# Placeholder variables for future guardrails module wiring
variable "db_engine" {
  description = "Placeholder for guardrails module"
  type        = string
  default     = "none"
}

variable "allow_paid" {
  description = "Guardrails flag to allow paid resources"
  type        = bool
  default     = false
}

variable "acc_color" {
  description = <<EOT
Human-friendly account color label (cosmetic, used as 'Color' tag).
EOT
  type        = string
  default     = "blue"
}

variable "tags" {
  description = "Additional resource tags to merge with defaults"
  type        = map(string)
  default     = {}
}
