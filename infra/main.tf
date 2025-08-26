terraform {
  required_providers {
    aws     = { source = "hashicorp/aws",   version = "~> 5.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.0" }
    null    = { source = "hashicorp/null",    version = "~> 3.0" }
  }
}

provider "aws" {
  region  = var.region
  profile = var.profile

  # Push a consistent tag set to every resource the provider creates
  default_tags {
    tags = {
      Project = var.name_prefix
      Env     = var.env
      Owner   = "abdullah"
      Color   = var.acc_color
      # Any extra tags from var.tags will be merged in locals below and passed explicitly to modules.
    }
  }
}

locals {
  # Base tags we always want
  base_tags = {
    Project = var.name_prefix
    Env     = var.env
    Owner   = "abdullah"
    Color   = var.acc_color
  }

  # Clean user-supplied tags (avoid colliding with our reserved keys)
  cleaned_tags = {
    for k, v in var.tags :
    title(k) => v
    if !(lower(k) == "project" || lower(k) == "owner" || lower(k) == "env" || lower(k) == "color")
  }

  # Final tag map we pass into modules/resources that accept tags explicitly
  common_tags = merge(local.base_tags, local.cleaned_tags)
}

module "aws_serverless_api" {
  source                    = "./modules/aws/serverless_api"

  # Naming and env
  name_prefix               = var.name_prefix
  region                    = var.region
  env                       = var.env

  # Lambda sizing/behavior
  memory                    = var.memory
  timeout_seconds           = var.timeout_seconds
  log_retention_days        = var.log_retention_days
  public_access             = var.public_access

  # DynamoDB wiring
  nosql_table_or_collection = var.nosql_table_or_collection
  allow_ddb_putitem         = true

  # Pass the table name into Lambda as DDB_TABLE
  environment = {
    DDB_TABLE = var.nosql_table_or_collection
  }

  # Centralized tags (now include Color)
  tags = local.common_tags
}

module "guardrails" {
  source          = "./modules/guardrails"
  memory          = var.memory
  timeout_seconds = var.timeout_seconds
  db_engine       = var.db_engine
  read_capacity   = 1
  write_capacity  = 1
  allow_paid      = var.allow_paid
}

module "iam_deployer" {
  source      = "./modules/iam/deployer"
  name_prefix = var.name_prefix
  tags        = local.common_tags
}

output "api_url"             { value = module.aws_serverless_api.api_url }
output "dynamodb_table"      { value = module.aws_serverless_api.dynamodb_table }
output "lambda_function_arn" { value = module.aws_serverless_api.lambda_function_arn }
