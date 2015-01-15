#!/bin/sh
### BEGIN INIT INFO
# Provides:          cwpm
# Required-Start:    $local_fs $network $named $time $syslog
# Required-Stop:     $local_fs $network $named $time $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Description:       A pool manager for cloudify widget
### END INIT INFO

source /etc/sysconfig/widget-ui
INSTALL_LOCATION=/var/www/cloudify-widget-ui/package
SCRIPT=$INSTALL_LOCATION/start.sh
RUNAS=root
PIDNAME=widgetui
PIDFILE=/var/run/$PIDNAME.pid
LOGFILE=/var/log/$PIDNAME.log

start() {
    echo "pidname is [$PIDNAME]"
  if [ -f /var/run/$PIDNAME.pid ] && kill -0 $(cat /var/run/$PIDNAME.pid); then
    echo 'Service already running' >&2
    return 1
  fi
  echo 'Starting service...' >&2
  local CMD="$SCRIPT &> \"$LOGFILE\" "
  echo "CMD is [$CMD]"
  su -c "$CMD" $RUNAS
  echo 'Service started' >&2
}

stop() {
  if [ ! -f "$PIDFILE" ] || ! kill -0 $(cat "$PIDFILE"); then
    echo 'Service not running' >&2
    return 1
  fi
  echo 'Stopping service…' >&2
  kill -15 $(cat "$PIDFILE") && rm -f "$PIDFILE"
  echo 'Service stopped' >&2
}

status(){

    PROC_FILE=/proc/`cat $PIDFILE`
    if [ -e $PROC_FILE ]; then
        echo "service is running"
        return 0
    else
        echo "service is stopped"
        return 0
    fi
}

upgrade(){
    $INSTALL_LOCATION/build/upgrade.sh
}


case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  upgrade)
    upgrade
    ;;
  status)
    status
    ;;
  restart)
    stop
    start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|upgrade|status}"
esac
