variable "name_prefix" {
  description = "Project/name prefix for resources"
  type        = string
}

variable "region" {
  description = "AWS region for resources"
  type        = string
}

variable "env" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "memory" {
  description = "Lambda memory in MB"
  type        = number
  default     = 128
}

variable "timeout_seconds" {
  description = "Lambda timeout seconds"
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "public_access" {
  description = "If true, allow public (unauth) access; if false, require AWS_IAM"
  type        = bool
  default     = false
}

variable "nosql_table_or_collection" {
  description = "DynamoDB table name to create/use"
  type        = string
}

variable "allow_ddb_putitem" {
  description = "Grant Lambda permission to PutItem to the DDB table"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Extra environment variables for the Lambda"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
