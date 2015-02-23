#!/bin/sh
# use this script by running
# yum -y install dos2unix && wget --no-cache --no-check-certificate -O - http://get.gsdev.info/cloudify-widget-ui/1.0.0/install.sh | dos2unix | bash


install_main(){

    eval "`wget --no-cache --no-check-certificate -O - http://get.gsdev.info/gsat/1.0.0/install_gsat.sh | dos2unix`"

    SYSCONFIG_FILE=widget-ui read_sysconfig

    install_mongo

    install_nginx

    install_node

    upgrade_main


}

upgrade_main(){
    echo "start upgrade_main"
     eval "`wget --no-cache --no-check-certificate -O - http://get.gsdev.info/gsat/1.0.0/install_gsat.sh | dos2unix`"

    echo "upgrade_main, before SYSCONFIG_FILE"
    SYSCONFIG_FILE=widget-ui read_sysconfig


    BUILD_ID_FILE="/var/www/cloudify-widget-ui/build.id"
    BUILD_ID_URL="http://get.gsdev.info/cloudify-widget-ui/1.0.0/build.id"

    CURRENT_BUILD_ID=""
    if [ -f "$BUILD_ID_FILE" ];then
        CURRENT_BUILD_ID=`cat $BUILD_ID_FILE`
    fi

    AVAILABLE_BUILD_ID=`wget --no-cache --no-check-certificate -O - $BUILD_ID_URL`
    INSTALL_LOCATION=/var/www/cloudify-widget-ui/package

    if [ "$AVAILABLE_BUILD_ID" != "$CURRENT_BUILD_ID" ];then
        PACKAGE_URL=http://get.gsdev.info/cloudify-widget-ui/1.0.0/cloudify-widget-ui-1.0.0.tgz
        echo "installing ui npm package from [ $PACKAGE_URL ]"

        mkdir -p /var/www/cloudify-widget-ui
        cd /var/www/cloudify-widget-ui

        wget "$PACKAGE_URL" -O widget-ui.tgz
        rm -Rf package
        tar -xzvf widget-ui.tgz

        # npm install $PACKAGE_URL -g --prefix /var/www/cloudify-widget-ui

        echo "converting files to unix format"
        find /var/www/cloudify-widget-ui -name "*.sh" -type f -print0 | xargs -0 dos2unix

        echo "chmodding shell scripts for execution"
        find /var/www/cloudify-widget-ui -name "*.sh" -type f -print0 -exec chmod +x {} \;


        echo "installing initd script"
        echo "installing service script under widget-ui"
        SERVICE_NAME=widget-ui SERVICE_FILE=$INSTALL_LOCATION/build/service.sh install_initd_script

        echo "$AVAILABLE_BUILD_ID" > "$BUILD_ID_FILE"
    fi

    echo "installing me.conf"
    check_exists ME_CONF_URL;



    mkdir -p $INSTALL_LOCATION/conf/dev
    run_wget -O $INSTALL_LOCATION/conf/dev/me.json $ME_CONF_URL
    dos2unix $INSTALL_LOCATION/conf/dev/me.json

    echo "installing/upgrading cloudify from [ $CLOUDIFY_URL ]"
    install_cloudify

    dos2unix $INSTALL_LOCATION/build/nginx.conf
    source $INSTALL_LOCATION/build/nginx.conf | dos2unix > /etc/nginx/sites-enabled/widget-ui.conf
    service nginx restart

    echo "service widget-ui"
    service widget-ui

    ln -s /root/softlayer_widget/ /var/www/cloudify-widget-ui/package/softlayer_widget

}

setup_local_env(){

    if [ ! -f softlayer_widget/bin/activate ];then
        echo updating apt cache
        python -mplatform | grep -i ubuntu && sudo apt-get -y update || sudo yum -y update

        # install prereqs
        echo installing prerequisites
        python -mplatform | grep -i ubuntu && sudo apt-get install -y curl python-dev vim || sudo yum install -y curl python-dev vim

        # install pip
        curl --silent --show-error --retry 5 https://bootstrap.pypa.io/get-pip.py | sudo python
        # go home
        cd ~

        # virtualenv
        echo installing virtualenv
        sudo pip install virtualenv==1.11.4
        echo creating cloudify virtualenv
        virtualenv softlayer_widget
        source softlayer_widget/bin/activate

        # install cli
        pip install cloudify==3.1

        # add cfy bash completion
        activate_cfy_bash_completion
    else
        echo "local environment already installed"
    fi


}

set -e
if [ "$1" = "upgrade" ];then
    echo "upgrading"
    #setup_local_env
    upgrade_main


else
    echo "installing..."
    install_main

fi

set +e
