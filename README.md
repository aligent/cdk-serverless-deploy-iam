# Service IAM bootstrap stack

## Introduction
This repository contains a stack which can be deployed into an AWS account to provide IAM resources required by [Aligent Serverless based microservices](https://github.com/aligent/serverless-aws-nodejs-service-template).

This stack will provision a CloudFormation IAM role with the required permissions to deploy a standard Serverless application. It will also provision a deploy user with permission to assume the afro mentioned role. This user can then be used in deployment pipelines.

Services are then deployed referencing the role produced by this stack. This is done by adding the `provider.cfnRole` key to the project's `serverless.yml`. 
This ARN is provided as a stack output.


## Usage
This repository does not need to be forked, copied or imported. The intention is for it to be deployed *AS IS* into each environment for each service.
Additional permissions should be added to this stack and feature flagged rather than being added ad hoc to the environment.

This tool is philosophically similar to the [AWS CDK Bootstrap](https://github.com/aws/aws-cdk/blob/master/design/cdk-bootstrap.md) but specific to Aligent services IAM resources. 

### Parameters 
The CDK stack requires the service name to be provided as an environment variable.
This is the name of the Serverless application.

### Deploying:
The intention is that this stack is deployed manually using the CDK CLI by an IAM user with admin privileges. 
This should then be the last deployment into the environment from outside automated pipelines.

The actual Serverless app can then be created and completely managed by the CI user via pipelines.

Use the following command to deploy this into an environment:

```
SERVICE_NAME=<SERVICE_NAME> npx cdk deploy --profile <AWS_PROFILE> --region <AWS_REGION>
```
