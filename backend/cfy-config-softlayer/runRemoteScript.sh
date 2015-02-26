#!/bin/sh

# Change password for the users: db2inst1, db2fenc1.
# New password will be the value of NEW_PASSWORD env variable.

ctx logger info "installing sshpass"
python -mplatform | grep -i ubuntu && sudo apt-get install -y sshpass || sudo yum -y install sshpass


ctx logger info "changing passwords for db2inst1, db2fenc1"
ctx logger info "scp to copy changePwd.sh to ${HOST_IP} as root"
sshpass -p ${ADMIN_PASSWORD} scp -oStrictHostKeyChecking=no `pwd`/backend/cfy-config-softlayer/changePwd.sh root@${HOST_IP}:/tmp

ctx logger info "running changePwd.sh script via ssh"
sshpass -p ${ADMIN_PASSWORD} ssh -oStrictHostKeyChecking=no root@${HOST_IP} "/tmp/changePwd.sh ${NEW_PASSWORD}"

