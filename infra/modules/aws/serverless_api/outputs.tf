output "lambda_function_name" {
  value = aws_lambda_function.fn.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.fn.arn
}

output "api_url" {
  value = aws_lambda_function_url.url.function_url
}

output "dynamodb_table" {
  value = aws_dynamodb_table.events.name
}
