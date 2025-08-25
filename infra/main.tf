terraform {
  required_providers {
    aws = { source = "hashicorp/aws",    version = "~> 5.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.0" }
    null = { source = "hashicorp/null", version = "~> 3.0" }
  }
}

provider "aws" {
  region  = var.region
  profile = var.profile
}

locals {
  base_tags = { Project = var.name_prefix, Env = var.env, Owner = "abdullah" }
  cleaned_tags = {
    for k, v in var.tags :
    title(k) => v
    if !(lower(k) == "project" || lower(k) == "owner" || lower(k) == "env")
  }
  common_tags = merge(local.base_tags, local.cleaned_tags)
}

module "aws_serverless_api" {
  source                    = "./modules/aws/serverless_api"
  name_prefix               = var.name_prefix
  region                    = var.region
  env                       = var.env
  memory                    = var.memory
  timeout_seconds           = var.timeout_seconds
  nosql_table_or_collection = var.nosql_table_or_collection
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
  public_access             = var.public_access
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
