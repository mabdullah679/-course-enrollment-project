cloud_provider = "gcp"
deploy_type    = "serverless_api"
env            = "dev"
budget_profile = "free_first"
region         = "us-central1"
name_prefix    = "cegm"
cpu             = 1
memory          = 256
min_scale       = 0
max_scale       = 2
timeout_seconds = 10
db_engine                 = "nosql"
nosql_table_or_collection = "events"
enable_cors     = true
allowed_origins = ["*"]
tags = { project = "course-enrollment", owner = "abdullah" }
ttl_hours = 8
