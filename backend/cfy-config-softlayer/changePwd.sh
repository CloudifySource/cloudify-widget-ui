#!/bin/sh

echo "db2inst1:$1" | chpasswd
echo "db2fenc1:$1" | chpasswd
