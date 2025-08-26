env                         = "dev"
project                     = "cegm"
owner                       = "abdullah"

memory                      = 128
timeout_seconds             = 10
min_scale                   = 0
max_scale                   = 1

db_engine                   = "dynamodb"
nosql_table_or_collection   = "cegm-events"

use_api_gateway             = false
enable_cors                 = true
allowed_origins             = ["http://localhost:5173", "http://127.0.0.1:5173"]

tags = {
  Project = "cegm"
  Owner   = "abdullah"
  Env     = "dev"
}

ttl_hours                   = 0
