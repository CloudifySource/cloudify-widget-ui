#!/bin/sh

# Change password for the users: db2inst1, db2fenc1.
# New password will be the value of NEW_PASSWORD env variable.

echo "changing passwords for db2inst1, db2fenc1"
echo "user: `whoami`"
echo "new password: ${NEW_PASSWORD}"

echo "db2inst1:${NEW_PASSWORD}" | sudo chpasswd
echo "db2fenc1:${NEW_PASSWORD}" | sudo chpasswd
