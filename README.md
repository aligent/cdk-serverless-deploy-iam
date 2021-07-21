# Aligent service deploy role

This repository contains a stack which can be deployed into AWS accounts to provide a CloudFormation deploy role.
Micro-services are then deployed referencing the role produced by this stack.

This repository does not need to be forked, copied or imported. The intention is for it to be deployed *AS IS* into each environment.

## Deploying:
Use the following command to deploy this into an environment:
```
npx cdk deploy --profile <PROFILE-NAME> --region ap-southeast-2
```
