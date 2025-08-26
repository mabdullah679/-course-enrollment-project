import json
import os
import time
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DDB_TABLE = os.environ.get("DDB_TABLE", "cegm-events")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DDB_TABLE)

def _parse_body(event):
  body = event.get("body")
  if isinstance(body, str):
    try:
      return json.loads(body) if body else {}
    except json.JSONDecodeError:
      return {"raw": body}
  if isinstance(body, dict):
    return body
  return {}

def lambda_handler(event, context):
  """
  Writes a smoke item to DynamoDB:
    { id: "smoke-<epoch_ms>", source: "smoke", ts: <epoch_ms>, echo: <payload> }
  Returns 200 with {ok:true, id}.
  Works with Function URL (AWS_IAM) and direct aws lambda invoke.
  """
  try:
    payload = _parse_body(event)
    epoch_ms = int(time.time() * 1000)
    smoke_id = f"smoke-{epoch_ms}"

    item = {
      "id": smoke_id,
      "source": "smoke",
      "ts": epoch_ms,
      "echo": payload,
    }

    logger.info({"msg": "writing smoke item", "table": DDB_TABLE, "id": smoke_id})
    table.put_item(Item=item)

    return {
      "statusCode": 200,
      "headers": {"Content-Type": "application/json"},
      "body": json.dumps({"ok": True, "id": smoke_id}),
    }
  except ClientError as ce:
    logger.error({"error": "ddb_client_error", "details": str(ce)})
    return {
      "statusCode": 500,
      "headers": {"Content-Type": "application/json"},
      "body": json.dumps({"ok": False, "error": "ddb_client_error"}),
    }
  except Exception as e:
    logger.error({"error": "unhandled", "details": str(e)})
    return {
      "statusCode": 500,
      "headers": {"Content-Type": "application/json"},
      "body": json.dumps({"ok": False, "error": "unhandled"}),
    }