# http://toomuchdata.com/2014/02/16/how-to-install-python-on-centos/

echo "installing preparation"
yum groupinstall "Development tools"
yum install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel db4-devel libpcap-devel xz-devel

echo "enable unicode on python (increases performance, increases memory)"


echo "downloading python 2.7.6 and compiling it"
# Python 2.7.6:
wget http://python.org/ftp/python/2.7.6/Python-2.7.6.tar.xz
tar xf Python-2.7.6.tar.xz
cd Python-2.7.6
./configure --prefix=/usr/local --enable-unicode=ucs4 --enable-shared LDFLAGS="-Wl,-rpath /usr/local/lib"
make && make altinstall


echo "install pip"
# First get the setup script for Setuptools:
wget https://bitbucket.org/pypa/setuptools/raw/bootstrap/ez_setup.py

# Then install it for Python 2.7 and/or Python 3.3:
python2.7 ez_setup.py

# Now install pip using the newly installed setuptools:
easy_install-2.7 pip

echo "pip installed. you can now run pip2.7 install and such"



echo "installing virtualenv"

pip2.7 install virtualenv


echo "virtualenv installed. now you can run virtualenv-2.7 command"

echo "installing softlayer commandline"
pip2.7 install softlayer

echo "making sure sl command is available from sudo as well"
ln -s /usr/local/bin/sl /usr/bin/sl

