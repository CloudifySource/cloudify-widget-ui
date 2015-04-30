set -e

# old script bootstrap_script located in bucket=cloudify-widget-bootstrap of ec2automations !!
#"https://s3.amazonaws.com/cloudify-widget-bootstrap/ops+provision+script/bootstrap_script.sh"
# new script doesn't work.
# sudo wget https://github.com/cloudify-cosmo/cloudify-packager/blob/495db9092bbea660474a17dc57eeb8058e0f2aae/packer/vagrant/provision.sh



source bootstrap_script.sh

# cloudify 3.1 : cloudify-widget-3.1 changed to cloudify 3.2 :  cloudify-widget-3.2
wget "https://github.com/cloudify-cosmo/cloudify-nodecellar-example/archive/cloudify-widget-3.2.zip" -O blueprint.zip

echo "#################### update and clean source ######################"
sudo apt-get update
sudo apt-get clean
echo "#################### force installation ######################"
sudo apt-get -f -y install

echo "#################### dpkg something ######################"
sudo dpkg --configure -a
sudo apt-get -f -y install

echo "#################### installing zip unzip ######################"
sudo apt-get -y install zip unzip
echo "#################### running unzip ######################"
unzip -n blueprint.zip

cd cloudify-nodecellar-example-cloudify-widget-3.2
echo "#################### uploading nodecellar blueprint ######################"
cfy blueprints upload -b nodecellar1 -p singlehost-blueprint.yaml -v

echo "#################### running cfy commands ######################"
cd /home/ubuntu/
echo "####################  cfy init ######################"
cfy init

echo "#################### running cfy use ######################"
cfy use -t localhost

echo "#################### Starting butterfly ######################"
sudo pip install https://github.com/LironHazan/butterfly/archive/master.zip

echo "PS1=\"Cloudify3>\""  > ~/.bashrc

nohup butterfly.server.py --host="0.0.0.0" --port=8011 --prompt_login=False --unsecure &

sleep 10

echo successfully
