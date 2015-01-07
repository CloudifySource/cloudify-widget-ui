
[![Build Status](https://travis-ci.org/CloudifySource/cloudify-widget-ui.svg?branch=cw_200_setup_travis)](https://travis-ci.org/CloudifySource/cloudify-widget-ui)

Description
===========

testing

A REST service that exposes widget ui


Installation
============

The build is available at [http://get.gsdev.info/cloudify-widget-ui/]

we are overriding existing builds, so when you point to a build, you might get

a different build each time.


## Installation Steps

 * Create an executable file [/etc/sysconfig/widget-ui](./build/SYSCONFIG_TEMPLATE)
 * Run the following line of code

````

yum -y install dos2unix && wget --no-cache --no-check-certificate -O - http://get.gsdev.info/cloudify-widget-ui/1.0.0/install.sh | dos2unix | bash

````

if installation went successfully you will have the following commands available on your command line

````

service widget-ui status
service widget-ui start
service widget-ui stop
service widget-ui restart
service widget-ui upgrade

````

API
====

TBD
