# Variables are in variables.tf — DO NOT redeclare here.

# Deduplicate tags (AWS is case-insensitive)
locals {
  # Normalize keys: only use TitleCase once
  base_tags = {
    Project = var.name_prefix
    Env     = var.env
    Owner   = "abdullah"
  }

  common_tags = merge(local.base_tags, var.tags)
}

# DynamoDB table
resource "aws_dynamodb_table" "this" {
  name           = "${var.name_prefix}-${var.nosql_table_or_collection}"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = local.common_tags
}

# IAM role
resource "aws_iam_role" "lambda_exec" {
  name = "${var.name_prefix}-lambda-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

# Attach basic Lambda logging
resource "aws_iam_role_policy_attachment" "lambda_basic_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB inline policy
resource "aws_iam_role_policy" "lambda_dynamo_policy" {
  name = "${var.name_prefix}-lambda-dynamo"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem"],
      Resource = aws_dynamodb_table.this.arn
    }]
  })
}

# CloudWatch log group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.name_prefix}-lambda"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# Lambda code archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    filename = "index.py"
    content  = <<PY
import json

def _resp(code=200, body=None):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body if body is not None else {})
    }

def handler(event, context):
    path   = event.get("rawPath", "/")
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    if method == "GET" and path == "/health":
        return _resp(200, {"ok": True})

    if method == "POST" and path == "/echo":
        body = event.get("body")
        try:
            data = json.loads(body) if body else {}
        except Exception:
            return _resp(400, {"error": "invalid JSON"})
        return _resp(200, {"received": data})

    if method == "POST" and path == "/enroll":
        body = event.get("body")
        data = json.loads(body) if body else {}
        return _resp(201, {"enrolled": data})

    return _resp(200, {"message": "pong", "input": event})
PY
  }
}

# Lambda function
resource "aws_lambda_function" "this" {
  function_name    = "${var.name_prefix}-lambda"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "python3.12"
  handler          = "index.handler"
  memory_size      = var.memory
  timeout          = var.timeout_seconds
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.common_tags
}

# Lambda URL
variable "public_access" {
  description = "If true, sets Lambda Function URL auth to NONE (public). If false, uses AWS_IAM."
  type        = bool
  default     = false
}

resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = var.public_access ? "NONE" : "AWS_IAM"
}


# Allow the provisioned exec role to invoke the function URL
data "aws_caller_identity" "current" {}

resource "aws_lambda_permission" "allow_user_invoke" {
  statement_id           = "AllowUserInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.this.function_name
  function_url_auth_type = "AWS_IAM"
  principal              = "arn:aws:iam::025066259864:user/aws-cli-client"
}



# Outputs
output "api_url" {
  value = aws_lambda_function_url.this.function_url
}

output "dynamodb_table" {
  value = aws_dynamodb_table.this.name
}

output "lambda_exec_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

