# 🌐 VM/EC2 Setup Guide

This guide provides steps for setting up a VM or EC2 instance on Azure or AWS, including installing required software, configuring a CI/CD pipeline, setting up PM2 for process management, and configuring Nginx with SSL.

## 📑 Table of Contents

- [🌐 VM/EC2 Setup Guide](#-vmec2-setup-guide)
  - [📑 Table of Contents](#-table-of-contents)
  - [1. ⚙️ Create a VM or EC2 Instance](#1-️-create-a-vm-or-ec2-instance)
  - [2. 🛠️ Install Required Software](#2-️-install-required-software)
    - [Update and Upgrade](#update-and-upgrade)
    - [Install NVM (Node Version Manager)](#install-nvm-node-version-manager)
    - [Source the .bashrc File](#source-the-bashrc-file)
    - [Verify NVM Installation](#verify-nvm-installation)
    - [Install Node.js](#install-nodejs)
  - [3. 🚀 CI/CD Setup with GitHub Action Runner](#3--cicd-setup-with-github-action-runner)
    - [Register a Self-Hosted Runner](#register-a-self-hosted-runner)
    - [Configure the Runner](#configure-the-runner)
  - [4. ⚡ Install and Configure PM2](#4--install-and-configure-pm2)
    - [Install PM2](#install-pm2)
    - [Clone Your Project](#clone-your-project)
    - [Start Your Application with PM2](#start-your-application-with-pm2)
    - [Configure PM2 to Start on Boot](#configure-pm2-to-start-on-boot)
  - [5. 🌐 Configure Nginx as a Reverse Proxy and Set Up SSL with Certbot](#5--configure-nginx-as-a-reverse-proxy-and-set-up-ssl-with-certbot)
    - [Install Nginx](#install-nginx)
    - [Configure Nginx](#configure-nginx)
    - [Create a symbolic link to enable the site:](#create-a-symbolic-link-to-enable-the-site)
    - [Test and Reload Nginx](#test-and-reload-nginx)
    - [Install Certbot and Obtain an SSL Certificate](#install-certbot-and-obtain-an-ssl-certificate)
    - [Run Certbot to Obtain and Install the SSL Certificate](#run-certbot-to-obtain-and-install-the-ssl-certificate)

---

## 1. ⚙️ [Create a VM or EC2 Instance](#1-⚙️-create-a-vm-or-ec2-instance)

Create a VM on Azure or EC2 on AWS with your preferred specifications.

---

## 2. 🛠️ [Install Required Software](#2-🛠️-install-required-software)

### Update and Upgrade

```bash
sudo apt update
sudo apt upgrade
```

### Install NVM (Node Version Manager)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

### Source the .bashrc File

```bash
source ~/.bashrc
```

### Verify NVM Installation

```bash
nvm --version
```

### Install Node.js

```bash
nvm install node
```

---

## 3. 🚀 [CI/CD Setup with GitHub Action Runner](#3-🚀-cicd-setup-with-github-action-runner)

### Register a Self-Hosted Runner

1. Go to your GitHub repository.
2. Navigate to **Settings > Actions > Runners > New self-hosted runner**.
3. Copy the commands provided.

### Configure the Runner

Navigate to the runner directory and execute the following commands:

```bash
cd path/to/runner
sudo ./svc.sh install
sudo ./svc.sh install <your-username>
sudo ./svc.sh start
```

**[More Details](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)**

---

## 4. ⚡ [Install and Configure PM2](#4-⚡-install-and-configure-pm2)

### Install PM2

```bash
npm install pm2@latest -g
```

### Clone Your Project

```bash
git clone <your-repository-url>
```

**Note:** Ensure you set up `.env` in your project, or it will fail to start.

### Start Your Application with PM2

```bash
pm2 start /path/to/your/app.js --name sohozmeal
pm2 save
```

### Configure PM2 to Start on Boot

```bash
pm2 startup
sudo env PATH=$PATH:/home/your-username/.nvm/versions/node/$(node -v)/bin /home/your-username/.nvm/versions/node/$(node -v)/lib/node_modules/pm2/bin/pm2 startup systemd -u your-username --hp /home/your-username
pm2 save
```

---

## 5. 🌐 [Configure Nginx as a Reverse Proxy and Set Up SSL with Certbot](#5-🌐-configure-nginx-as-a-reverse-proxy-and-set-up-ssl-with-certbot)

### Install Nginx

```bash
sudo apt install nginx
```

### Configure Nginx

Edit the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/my.website.com
```

Add the following content:

```bash
server {
    listen 80;
    listen [::]:80;

    server_name my.website.com www.my.website.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/my.website.com /etc/nginx/sites-enabled/
```

### Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Install Certbot and Obtain an SSL Certificate

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Run Certbot to Obtain and Install the SSL Certificate

```bash
sudo certbot --nginx
```

**[More About Nginx Reverse Proxy with SSL Certification](https://dev.to/yousufbasir/setting-up-nginx-with-certbot-for-https-on-your-web-application-n1i)**

---

By following this guide, you should have your VM or EC2 instance set up with Node.js, PM2 for process management, and Nginx configured as a reverse proxy with SSL. This will allow you to deploy and manage your applications effectively.
