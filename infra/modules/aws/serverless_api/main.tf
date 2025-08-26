locals {
  lambda_function_name = "${var.name_prefix}-${var.env}-lambda"
  table_name           = var.nosql_table_or_collection
}

# DynamoDB table, on-demand, Always-Free friendly
resource "aws_dynamodb_table" "events" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(var.tags, {
    Name    = local.table_name
    Purpose = "serverless-api-events"
  })
}

# IAM role for Lambda
data "aws_iam_policy_document" "assume_lambda" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${local.lambda_function_name}-exec"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
  tags               = var.tags
}

# Policy: CloudWatch Logs + (optionally) DynamoDB PutItem on this table
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    sid     = "Logs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.allow_ddb_putitem ? [1] : []
    content {
      sid     = "DDBPut"
      actions = ["dynamodb:PutItem"]
      resources = [aws_dynamodb_table.events.arn]
    }
  }
}

resource "aws_iam_role_policy" "lambda_inline" {
  name   = "${local.lambda_function_name}-inline"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# Package: expect lambda.zip colocated with this module
# You are already placing a zip here per your repo tree.
# Handler is handler.lambda_handler (Python).
resource "aws_lambda_function" "fn" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_exec.arn

  filename         = "${path.module}/lambda.zip"
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  memory_size      = var.memory
  timeout          = var.timeout_seconds
  publish          = true
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")

  environment {
    variables = merge({
      ENV       = var.env
      REGION    = var.region
      DDB_TABLE = local.table_name
    }, var.environment)
  }

  tags = var.tags
}

# Explicit log group to control retention
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.fn.function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# Function URL, default to AWS_IAM unless public_access=true
resource "aws_lambda_function_url" "url" {
  function_name      = aws_lambda_function.fn.function_name
  authorization_type = var.public_access ? "NONE" : "AWS_IAM"

  cors {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]  # don't include OPTIONS
    allow_headers = ["*"]
    max_age       = 300
  }
}


