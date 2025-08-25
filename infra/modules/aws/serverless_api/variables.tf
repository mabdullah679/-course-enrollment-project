variable "name_prefix"               { type = string }
variable "region"                    { type = string }
variable "env"                       { type = string }
variable "memory"                    { type = number }
variable "timeout_seconds"           { type = number }
variable "nosql_table_or_collection" { type = string }

# Module-specific additions
variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}
