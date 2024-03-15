# The hodgepodge of proxy configuration

---

## disclaimer

**This lecture only introduces proxy configuration method in different context from a university students' perspective. It won't provide any information about proxy sources, please STFW on your own.**

---

## Introduction

Proxy is a server that acts as an intermediary for requests from clients seeking resources from other servers. A client connects to the proxy server, requesting some service, such as a file, connection, web page, or other resource available from a different server and the proxy server evaluates the request as a way to simplify and control its complexity.

Due to the inherent feature of our country, we need to use proxy to access some foreign websites or speed up the working efficiency when setting up the environment. This lecture will introduce the proxy configuration method in different context.

---

# Basic Assumptions

- The proxy server is running on `localhost` and listening on port `7897`, unless otherwise specified.
- The proxy server is a HTTP/HTTPS proxy server, unless otherwise specified.
- You neither use `global proxy` nor `TUN mode`.

---

# Linux/Mac shell

<v-click>

```bash
alias setproxy='export http_proxy="http://127.0.0.1:7897"; \
export https_proxy="http://127.0.0.1:7897"; \
export socks_proxy="http://127.0.0.1:7897"'
alias unsetproxy='unset http_proxy;unset https_proxy;unset socks_proxy'
source ~/.bashrc (~/.zshrc etc.)
```

</v-click>

---

# Windows shell

<v-click>

- cmd

```cmd
# 设置代理
netsh winhttp set proxy 127.0.0.1:7897
# 取消代理
netsh winhttp reset proxy
# 查看代理
netsh winhttp show proxy
```

</v-click>

<v-click>

- powershell

```powershell
$Env:http_proxy="http://127.0.0.1:7897";$Env:https_proxy="http://127.0.0.1:7897"
```

</v-click>

<v-click>

- GUI(Windows 10/11)

1. Open `Settings` -> `Network & Internet` -> `Proxy`
2. Set `Manual proxy setup` to `On`
3. Fill in the `Address` and `Port` with `localhost` and `7897` respectively


</v-click>

---

# Vmware

assume you are using NAT mode and you enabled `allow LAN` in your proxy software.

<v-click>
 
1. check your ifconfig/ipconfig result of `vmnet8`

```
vmnet8: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.18.1  netmask 255.255.255.0  broadcast 192.168.18.255
        inet6 fe80::250:56ff:fec0:8  prefixlen 64  scopeid 0x20<link>
        ether 00:50:56:c0:00:08  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 103  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

</v-click>

<v-click>


2. set proxy in your vm

```bash
export http_proxy="http://192.168.18.1:7897"
export https_proxy="http://192.168.18.1:7897"
export socks_proxy="http://192.168.18.1:7897"
```

</v-click>


---

# VirtualBox

<v-click>

1. set your network adapter to `Host-only Adapter`

</v-click><v-click>

2. an interface named `vboxnet0` or other will be created


</v-click><v-click>


3. ifconfig/ipconfig to check the ip address

```bash
vboxnet0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.56.1  netmask 255.255.255.0  broadcast 192.168.56.255
        inet6 fe80::800:27ff:fe00:0  prefixlen 64  scopeid 0x20<link>
        ether 0a:00:27:00:00:00  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 33  bytes 3289 (3.2 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

</v-click><v-click>

4. set proxy in your vm, in this way you can also solve the problem of not able to access the internet in your vm

```bash
export http_proxy="http://192.168.56.1:7897"
export https_proxy="http://192.168.56.1:7897"
export socks_proxy="http://192.168.56.1:7897"
```

</v-click>

---

# browsers

<v-click>

- Chrome/Edge/Firefox

1. Open `Settings` 
2. Search `Proxy` and click `Open your computer's proxy settings` (Chrome/Edge), Firefox can be configured directly
3. Fill in the `Address` and `Port` with `localhost` and `7897` respectively

</v-click><v-click>

- Plugin (switchyomega, etc.)

1. Install the plugin
2. Options
3. New profile (proxy profile, enter your profile name)
4. select DIRECT -> HTTP
5. Fill in the `Address` and `Port` with `localhost` and `7897` respectively
6. Apply changes

</v-click>

---

# vscode/code - OSS/vscodium

- default use system proxy

Settings -> search `proxy` -> fill in `http://localhost:7897`

[![https://imgur.com/Pr8K8eH.png](https://imgur.com/Pr8K8eH.png)](https://imgur.com/Pr8K8eH.png)

---

# git

<v-click>

```bash
git config --global http.proxy http://localhost:7897
git config --global https.proxy https://localhost:7897

git config --global --unset http.proxy
git config --global --unset https.proxy
```

</v-click>

---

# ssh

<v-click>

```bash
Host github.com
    HostName ssh.github.com
    #HostName github.com
    port 443
    IdentityFile ~/.ssh/id_rsa
    User git
    ProxyCommand nc -v -x 127.0.0.1:7897 %h %p
```

</v-click>

---

# curl/wget  

default to use `http_proxy` and `https_proxy` environment variables, otherwise

<v-click>

```bash
curl -x localhost:7897 http://example.com
wget -e http_proxy=localhost:7897 http://example.com
```

</v-click>

---

# apt/yum/pacman

changing the mirror is a better choice (STFW)


<v-click>

```bash
/etc/apt/apt.conf.d/proxy.conf
Acquire::http::Proxy "http://proxy-IP-address:proxyport/";
Acquire::http::Proxy "http://proxy-IP-address:proxyport/";
```

</v-click><v-click>
```bash
/etc/yum.conf
proxy=http://localhost:7897
```
</v-click><v-click>

```bash
# delete either of the following lines, and configure the proxy in curl/wget
# setting http_proxy and https_proxy environment variables is also a good choice

/etc/pacman.conf
#XferCommand = /usr/bin/curl -L -C - -f -o %o %u
#XferCommand = /usr/bin/wget --passive-ftp -c -O %o %u
```

</v-click>
---

# docker

- dockerd

<v-click>

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo touch /etc/systemd/system/docker.service.d/proxy.conf

[Service]
Environment="HTTP_PROXY=http://localhost:7897/"
Environment="HTTPS_PROXY=http://localhost:7897/"
Environment="NO_PROXY=localhost,127.0.0.1,.example.com"

sudo systemctl daemon-reload
sudo systemctl restart docker
```

</v-click>

---

- container

<v-click>
```bash
~/.docker/config.json

{
 "proxies":
 {
   "default":
   {
     "httpProxy": "http://localhost:7897",
     "httpsProxy": "http://localhost:7897",
     "noProxy": "localhost,127.0.0.1,.example.com"
   }
 }
}
```

</v-click>

- build

<v-click>
```bash
docker build . \
    --build-arg "HTTP_PROXY=http://localhost:7897/" \
    --build-arg "HTTPS_PROXY=http://localhost:7897/" \
    --build-arg "NO_PROXY=localhost,127.0.0.1,.example.com" \
    -t your/image:tag
```

</v-click>
---

# pip

<v-click>
```bash
pip install --proxy http://localhost:7897 package
pip install --proxy https://localhost:7897 package
```

</v-click>
<v-click>
or change the mirror to a domestic one

```bash
~/.pip/pip.conf

[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
[install]
trusted-host = https://pypi.tuna.tsinghua.edu.cn
```

</v-click>
---

# conda

<v-click>
```bash
~/.condarc

channels:
  - defaults
show_channel_urls: true
default_channels:
  - https://mirrors.bfsu.edu.cn/anaconda/pkgs/main
  - https://mirrors.bfsu.edu.cn/anaconda/pkgs/r
  - https://mirrors.bfsu.edu.cn/anaconda/pkgs/msys2
custom_channels:
  conda-forge: https://mirrors.bfsu.edu.cn/anaconda/cloud
  msys2: https://mirrors.bfsu.edu.cn/anaconda/cloud
  bioconda: https://mirrors.bfsu.edu.cn/anaconda/cloud
  menpo: https://mirrors.bfsu.edu.cn/anaconda/cloud
  pytorch: https://mirrors.bfsu.edu.cn/anaconda/cloud
  pytorch-lts: https://mirrors.bfsu.edu.cn/anaconda/cloud
  simpleitk: https://mirrors.bfsu.edu.cn/anaconda/cloud
```

</v-click>
---

# npm

<v-click>

```
# 设置代理
npm config set proxy http://127.0.0.1:7897
npm config set https-proxy http://127.0.0.1:7897
# 取消代理
npm config delete proxy
npm config delete https-proxy
```

</v-click>
<v-click>

or

```bash
~/.npmrc

proxy=http://127.0.0.1:7897
https-proxy=http://127.0.0.1:7897
registry=https://registry.npmmirror.com/
```

</v-click>
---

# proxychains4

<v-click>

```bash
# /etc/proxychains.conf

[ProxyList]
# add proxy here ...
# meanwile
# defaults set to "tor"
# socks4 	127.0.0.1 9050
http 127.0.0.1 7897
socks5 127.0.0.1 7897
```

```bash
proxychains4 <your command>
```

</v-click>

---

<v-click>

a very fresh example: I want to use `xfce4-screenshooter` to upload a screenshot and paste in my markdown. I found that the upload server is blocked by the GFW, so I use proxychains4 to force it.

[![https://imgur.com/Qlz8jrV.png](https://imgur.com/Qlz8jrV.png)](https://imgur.com/Qlz8jrV.png)

</v-click>

--- 

# BELOW ARE F**KING JAVA SERIES, it is hard to configure the proxy in java, I mostly use mirrors.

---

# gradle


<v-click>

gradle.properties

```groovy
systemProp.http.proxyHost='localhost'
systemProp.http.proxyPort='7897'
# 过滤不使用代理的域名
systemProp.http.nonProxyHosts=*.example.com
systemProp.https.proxyHost='localhost'
systemProp.https.proxyPort='7897'
# 过滤不使用代理的域名
systemProp.https.nonProxyHosts=*.example.com
```

</v-click>
---

# maven

I choose to change the mirror to a domestic one

<v-click>

```bash
~/.m2/settings.xml
<settings>
    <mirrors>
        <mirror>
          <id>centralhttps</id>
          <mirrorOf>central</mirrorOf>
          <name>Maven central https</name>
          <url>http://insecure.repo1.maven.org/maven2/</url>
        </mirror>
      </mirrors>
      </settings>
```

</v-click>

---

# sbt

<v-click>

```bash
~/.sbt/repositories


[repositories]
local
aliyun: https://maven.aliyun.com/repository/central/
sbt-plugin-repo: https://repo.scala-sbt.org/scalasbt/sbt-plugin-releases, \
[organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext]



sudo vi /usr/share/sbt/conf/sbtopts
-Dsbt.override.build.repos=true
```

</v-click>
---

# coursier

<v-click>

```bash
export COURSIER_REPOSITORIES= \
"https://maven.aliyun.com/repository/public|https://maven.scijava.org/content/repositories/public"

# chisel installation modification
./coursier bootstrap -i user -I user:sh.almond:scala-kernel-api_$SCALA_VERSION:$ALMOND_VERSION  \
sh.almond:scala-kernel_$SCALA_VERSION:$ALMOND_VERSION     --sources --default=true     -o almond

```

</v-click>
---

# mill 

<v-click>

doesn't support proxy, use proxychains4 to force it

```bash
alias mill='proxychains4 mill'
```

</v-click>

---

# References

- https://doc.yoouu.cn/basic/proxy.html
- https://cloud-atlas.readthedocs.io/zh-cn/latest/linux/arch_linux/pacman_proxy.html
- https://pshizhsysu.gitbook.io/linux/yum/wei-yum-yuan-pei-zhi-dai-li
- https://zhuanlan.zhihu.com/p/629584549
- https://cloud.tencent.com/developer/article/1806455
- https://segmentfault.com/a/1190000021817234
- https://blog.csdn.net/weixin_43681766/article/details/122889519
- https://zhuanlan.zhihu.com/p/474087997
