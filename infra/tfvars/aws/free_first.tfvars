cloud_provider = "aws"
deploy_type    = "serverless_api"
env            = "dev"
budget_profile = "free_first"
region         = "us-east-1"
name_prefix    = "cegm"
runtime         = "python3.12"
memory          = 128
timeout_seconds = 10
min_scale       = 0
max_scale       = 2

db_engine                 = "nosql"
nosql_table_or_collection = "events"

use_api_gateway = false
enable_cors     = true
allowed_origins = ["*"]

tags      = { project = "course-enrollment", owner = "abdullah" }
ttl_hours = 8
public_access = true

# Make provider use your aws-cli-client profile
profile = "aws-cli-client"
