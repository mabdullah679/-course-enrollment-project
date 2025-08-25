variable "name_prefix" {
  description = "Prefix for naming IAM resources"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to IAM resources"
  type        = map(string)
  default     = {}
}
