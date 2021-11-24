# Serverless deploy IAM

## Introduction
This repository contains a stack which can be deployed into an AWS account to provide IAM resources required by [Aligent Serverless based microservices](https://github.com/aligent/serverless-aws-nodejs-service-template).

This stack will provision a CloudFormation IAM role with the required permissions to deploy a standard Serverless application. It will also provision a deploy user with permission to assume the afro mentioned role. This user can then be used in deployment pipelines.

Services are then deployed referencing the role produced by this stack. This is done by adding the `provider.cfnRole` key to the project's `serverless.yml`.
This ARN is provided as a stack output.

## Usage
This repository does not need to be forked, copied or imported. The intention is for it to be deployed *AS IS* into each environment for each service.
Additional permissions should be added to this stack and feature flagged rather than being added ad hoc to the environment.

This tool is philosophically similar to the [AWS CDK Bootstrap](https://github.com/aws/aws-cdk/blob/master/design/cdk-bootstrap.md) but specific to Aligent services IAM resources.

### Aliased Command
This ensures all the commands are run inside the serverless-deploy-iam docker container so that you don't need clone the repo.

Add the following to your .bashrc file:
```
alias serverless-deploy-iam='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app aligent/cdk-serverless-deploy-iam'
```

You will then need to reload your bashrc file, either by running `. ~/.bashrc` or starting a new terminal session.

To deploy the IAM role, provide a profile and service name: `serverless-deploy-iam --profile <profile name> --service <service name>`.

### Cloning the repo
#### Parameters
The CDK stack requires the service name to be provided as an environment variable.
This is the name of the Serverless application.

#### Deploying:
The intention is that this stack is deployed manually using the CDK CLI by an IAM user with admin privileges.
This should then be the last deployment into the environment from outside automated pipelines.

The actual Serverless app can then be created and completely managed by the CI user via pipelines.

Use the following command to deploy this into an environment:

```
SHARED_VPC_ID=<OPTIONAL> AWS_REGION=<AWS_REGION> SERVICE_NAME=<SERVICE_NAME> npx cdk deploy --profile <AWS_PROFILE>
```

### Next Steps
Once this finishes a user will be created (ARN in stack output). This user will have the appropriate permissions to assume the CloudFormation role and deploy the service.

Create AWS credentials for the user and add these as sensitive variables to the project's build pipeline.
