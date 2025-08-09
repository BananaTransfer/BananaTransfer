#!/usr/bin/sh

HOSTNAME="$1"
BUCKET="$2"

ssh admin@"$HOSTNAME" <<EOF
sudo bash -c "
cd /opt/app && \
aws s3 rm \"s3://$BUCKET/\" --recursive && \
docker compose down && \
docker volume rm app_pg_data
"
EOF

