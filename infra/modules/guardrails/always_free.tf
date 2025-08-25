variable "memory" {
  type = number
}

variable "timeout_seconds" {
  type = number
}

variable "db_engine" {
  type = string
}

variable "read_capacity" {
  type = number
  default = 1
}

variable "write_capacity" {
  type = number
  default = 1
}


variable "allow_paid" {
  type        = bool
  description = "Set true to allow deployments that exceed Always Free tier"
  default     = false
}

##########################
# AWS Always Free Limits #
##########################
# Lambda: 1M requests/mo, 400k GB-seconds, 128MB default safe
# DynamoDB: 25 RCU, 25 WCU, 25GB storage
# CloudWatch Logs: 5GB ingestion/mo
# S3: Only 5GB free for 12 months (not Always Free)
# RDS/EC2: only 12 month free; disable unless allow_paid = true

locals {
  aws_safe = {
    lambda_memory_mb       = 128
    lambda_timeout_seconds = 15
    dynamodb_max_rcu       = 25
    dynamodb_max_wcu       = 25
  }
}

# Check: Lambda memory
resource "null_resource" "check_lambda_memory" {
  count = var.memory > local.aws_safe.lambda_memory_mb && var.allow_paid == false ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: Lambda memory (${var.memory}) exceeds Always Free limit (${local.aws_safe.lambda_memory_mb}). Set allow_paid=true if intentional.' && exit 1"
  }
}

# Check: Lambda timeout
resource "null_resource" "check_lambda_timeout" {
  count = var.timeout_seconds > local.aws_safe.lambda_timeout_seconds && var.allow_paid == false ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: Lambda timeout (${var.timeout_seconds}s) too high for Always Free envelope (${local.aws_safe.lambda_timeout_seconds}s safe). Set allow_paid=true if intentional.' && exit 1"
  }
}

# Check: DynamoDB RCU/WCU
resource "null_resource" "check_dynamodb_capacity" {
  count = (
    var.db_engine == "nosql" &&
    (var.read_capacity > local.aws_safe.dynamodb_max_rcu || var.write_capacity > local.aws_safe.dynamodb_max_wcu) &&
    var.allow_paid == false
  ) ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: DynamoDB RCU/WCU exceed Always Free (25). Set allow_paid=true if intentional.' && exit 1"
  }
}


##########################
# GCP Always Free (stub) #
##########################
# - Cloud Run: 2M requests/mo, 180,000 vCPU-seconds, 360,000 GiB-seconds
# - Firestore: 50k reads, 50k writes, 1GB storage
# - Cloud Functions: 2M invocations, 400k GB-seconds
# - Compute Engine e2-micro: 1 VM instance free per month
#
# Uncomment when you add GCP provider modules
#
# resource "null_resource" "check_gcp_cloudrun" {
#   count = var.gcp_cpu > 1 && var.allow_paid == false ? 1 : 0
#   provisioner "local-exec" {
#     command = "echo 'ERROR: Cloud Run CPU > 1 violates Always Free. Set allow_paid=true if intentional.' && exit 1"
#   }
# }

############################
# Azure Always Free (stub) #
############################
# - Functions: 1M requests, 400k GB-seconds
# - CosmosDB: 400 RU/s, 25GB storage
# - App Service: 1 GB storage, 60 minutes/day
# - B1S VM: 750 hours/month free
#
# Uncomment when adding Azure provider
#
# resource "null_resource" "check_azure_functions" {
#   count = var.azure_memory > 1536 && var.allow_paid == false ? 1 : 0
#   provisioner "local-exec" {
#     command = "echo 'ERROR: Azure Functions memory > 1.5GB not free tier. Set allow_paid=true if intentional.' && exit 1"
#   }
# }
