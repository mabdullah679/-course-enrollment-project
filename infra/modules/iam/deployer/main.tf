resource "aws_iam_user" "deployer" {
  name = "${var.name_prefix}-deployer"
  tags = var.tags
}

resource "aws_iam_access_key" "deployer_key" {
  user = aws_iam_user.deployer.name
}

resource "aws_iam_user_policy" "deployer_policy" {
  name = "${var.name_prefix}-policy"
  user = aws_iam_user.deployer.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "lambda:*",
          "dynamodb:*",
          "logs:*"
        ],
        Resource = "*"
      }
    ]
  })
}

output "deployer_access_key_id" {
  value     = aws_iam_access_key.deployer_key.id
  sensitive = true
}

output "deployer_secret_access_key" {
  value     = aws_iam_access_key.deployer_key.secret
  sensitive = true
}
