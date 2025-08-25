# modules/aws/serverless_api/outputs.tf

output "dynamodb_table_name" {
  value = aws_dynamodb_table.this.name
}

output "lambda_role_name" {
  value = aws_iam_role.lambda_exec.name
}

output "lambda_allowed_account" {
  description = "The AWS account allowed to invoke Lambda"
  value       = data.aws_caller_identity.current.account_id
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}
