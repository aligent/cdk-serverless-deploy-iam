#!/bin/bash
#set -x

APP_ROOT="/app"

DOCKER_UID=`stat -c "%u" $APP_ROOT`
DOCKER_GID=`stat -c "%g" $APP_ROOT`

INCUMBENT_USER=`getent passwd $DOCKER_UID | cut -d: -f1`
INCUMBENT_GROUP=`getent group $DOCKER_GID | cut -d: -f1`

#echo "Docker: uid = $DOCKER_UID, gid = $DOCKER_GID"
#echo "Incumbent: user = $INCUMBENT_USER, group = $INCUMBENT_GROUP"

userdel node
groupadd -g ${DOCKER_GID} node
useradd -g ${DOCKER_GID} --home-dir /home/node -s /bin/bash -u ${DOCKER_UID} node

chown -R node:node /home/node/.config

cd $APP_ROOT

# Get all values from arguments
vpc=${vpc}
region=${region:-ap-southeast-2}
service=${service}
profile=${profile}
bootstrap=1

while [ $# -gt 0 ]; do
   if [[ $1 == *"--"* ]]; then
        param="${1/--/}"
        # If the bootstrap argument is passed, set to false
        if [ $param == "no-bootstrap" ]; then
            declare bootstrap=0
        else
            declare $param="$2"
        fi
   fi
  shift
done

# Error checking
if [ -z "$service" ]; then
    echo "Error: Please define a service name"
    exit 1
fi

# Run bootstrap unless otherwise specified
if [ $bootstrap == 1 ]; then
    sudo -u node cdk bootstrap --profile $profile
fi

sudo -u node -- sh -c "SHARED_VPC_ID=$vpc AWS_REGION=$region SERVICE_NAME=$service cdk deploy --profile $profile $@"
