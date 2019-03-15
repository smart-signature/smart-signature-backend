### API docs

#### 发布文章

* POST /publish
* 响应状态码：200

curl -d "author=tengavinwood&title=xxxxx&publickey=EOS8QP2Z6tApaUYPEC6hm9f1pZrSEMmZ7n5SsvjzA3VTnRXUyra9E&hash=QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy&sign=SIG_K1_KZU9PyXP8YAePjCfCcmBjGHARkvTVDjKpKvVgS6XL8o2FXTXUdhP3rqrL38dJYgJo2WNBdYubsY9LKTo47RUUE4N3ZHjZQ" -X POST http://127.0.0.1:7001/publish


#### 获取文章列表

* GET /posts

参数 
page: 页数，默认第一页

curl -X GET http://127.0.0.1:7001/posts
curl -X GET http://127.0.0.1:7001/posts?page=2


#### 获取用户信息
    
* GET /user/:username
* 响应状态码：200
* 响应体：

请求示例: 
curl -X GET http://127.0.0.1:7001/user/minakokojima

#### 文章分享上报

* POST /share
* 响应状态码：200

参数
user: 分享的用户
hash: 文章的唯一hash

请求示例: 
curl -d "user=joetothemoon&hash=QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy" -X POST http://127.0.0.1:7001/share

#### 文章支持上报

* POST /vote
* 响应状态码：200

参数
user: 分享的用户
hash: 文章的唯一hash

请求示例: 
curl -d "user=joetothemoon&hash=QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy" -X POST http://127.0.0.1:7001/vote


#### IPFS add

* POST /ipfs/add
* 响应状态码：200

#### IPFS addJSON

* POST /ipfs/addJSON
* 响应状态码：200


#### IPFS cat

* GET /ipfs/cat
* 响应状态码：200

#### IPFS catJSON

* GET /ipfs/catJSON
* 响应状态码：200




请求示例: 

curl -d "user=joetothemoon&hash=QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy" -X POST http://127.0.0.1:7001/ipfs/add
curl -d "data=xxxx" -X POST http://127.0.0.1:7001/ipfs/addJSON

curl -X GET http://127.0.0.1:7001/ipfs/cat/QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy

curl -X GET http://127.0.0.1:7001/ipfs/catJSON/QmNzMrW3J7eY6KPqXd3TLwr2Y31iga2QowzrhUPJYk2mcy


 

