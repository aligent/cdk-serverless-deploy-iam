# Aligent shared VPC stack

This repository contains a stack which can be deployed into AWS accounts to provide a stable elastic IP for micro-services.
Micro-services are then deployed into this VPC rather than creating their own.

Previously, existing Magento VPCs have been used to provide egress networking for Lambda functions.
This stack isolates the micro-services into their own VPC.

This repository does not need to be forked, copied or imported. The intention is for it to be deployed *AS IS* into each environment.

## Deploying:
Use the following command to deploy this into an environment:
```
npx cdk deploy --profile <PROFILE-NAME> --region ap-southeast-2
```
