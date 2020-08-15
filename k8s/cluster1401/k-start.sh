#!/bin/sh
kubectl apply -f pod.yaml
kubectl port-forward hello1401 1401:1401
