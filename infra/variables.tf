variable "region"           { description = "AWS region";                         type = string; default = "us-east-1" }
variable "profile"          { description = "AWS CLI/SDK profile to use";         type = string; default = "default" }
variable "name_prefix"      { description = "Prefix used to name resources";      type = string; default = "cegm" }
variable "env"              { description = "Environment (dev, staging, prod)";   type = string; default = "dev" }
variable "memory"           { description = "Lambda memory (MB)";                 type = number; default = 128 }
variable "timeout_seconds"  { description = "Lambda timeout seconds";             type = number; default = 10 }
variable "log_retention_days" { description = "CloudWatch Logs retention days";   type = number; default = 7 }
variable "public_access"    { description = "If true, Lambda URL is public";      type = bool;   default = false }
variable "nosql_table_or_collection" { description = "DynamoDB table name"; type = string; default = "cegm-events" }
variable "db_engine"        { description = "Placeholder for guardrails module";  type = string; default = "dynamodb" }
variable "allow_paid"       { description = "Guardrails flag to allow paid res";  type = bool;   default = false }

# NEW: console/account color you want to propagate as a tag and default tag
variable "acc_color" {
  description = "Human-friendly account color label (cosmetic; used as 'Color' tag)."
  type        = string
  default     = "purple"
}

variable "tags" {
  description = "Extra tags to merge (keys besides Project/Owner/Env/Color)."
  type        = map(string)
  default     = {}
}
