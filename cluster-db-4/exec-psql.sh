#!/bin/sh
docker-compose -f db.yaml exec cluster-db psql -U cluster
