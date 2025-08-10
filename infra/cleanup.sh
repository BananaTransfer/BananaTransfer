#!/usr/bin/sh

HOSTNAME="$1"
BUCKET="$2"

ssh -o StrictHostKeyChecking=no admin@"$HOSTNAME" <<EOF
sudo bash -c "
cd /opt/app && \
aws s3 rm \"s3://$BUCKET/\" --recursive && \
docker compose down && \
docker volume rm app_pg_data && \
(sleep 10 && shutdown -h now) & # hack to not get an error code as a return of this script when connection is killed by server
"
EOF

