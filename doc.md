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
    
新增, 返回fans数和follow数 ,is_follow 是否关注

* GET /user/:username
* 响应状态码：200
* 响应体：

```
{"username":"minakokojima","follows":4,"fans":5, is_follow: false }

```

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
 

#### 关注

* POST /follow
* 响应状态码：200

参数：
username: 当前用户
followed: 关注的用户

请求示例: 
curl -d "username=joetothemoon&followed=minakokojima" -X POST http://127.0.0.1:7001/follow

#### 取消关注

* POST /unfollow
* 响应状态码：200

参数：
username: 当前用户
followed: 关注的用户

请求示例: 
curl -d "username=joetothemoon&followed=minakokojima" -X POST http://127.0.0.1:7001/unfollow


#### Auth (请求获取 access token)

* POST /auth
* 响应状态码：200

参数：
username: 用户
publickey: 用户签名用的公钥
sign: 签名

成功得到 access_token 后 
在后续请求的请求头中带上access_token： req.header['x-access-token']

demo:

```
const API = {
  // 示例代码。。请随便改。。。
   authSignature(callback) {

    const account = this.getAccount();

    eosClient.getAccount(account.name, (error, result) => {
      // 获取当前权限
      const permissions = result.permissions.find(x => x.perm_name === account.authority);
      // 获取当前权限的public key
      const publicKey = permissions.required_auth.keys[0].key;
      // 需要签名的数据
      const sign_data = `${account.name}`;
      // 申请签名
      ScatterJS.scatter.getArbitrarySignature(publicKey, sign_data, 'Auth').then(signature => {
        callback(account.name, publicKey, signature);
      }).catch(error => {
        
      });
    })
  }
}

// 1. 取得签名
API.authSignature(function(username, publickey, sign){
    console.log(username, publickey, sign);
    // 2. post到服务端 获得accessToken并保存
    auth({ username, publickey, sign}, (error, response, body) => {
        console.log(body);
        if(!error){
            // 3. save accessToken 
            const accessToken = body;
            localStorage.setItem("ACCESS_TOKEN", accessToken);
        }
    })
});

// 示例代码。。请随便改。。。
function auth({
  username, publickey, sign
}, callback) {
  // const url = `${apiServer}/auth`;
  const url = `http://localhost:7001/auth`;
  return request({
    uri: url,
    rejectUnauthorized: false,
    json: true,
    headers: { Accept: '*/*', Authorization: "Basic bXlfYXBwOm15X3NlY3JldA==" },
    dataType: 'json',
    method: 'POST',
    form: {
      username,
      publickey,
      sign,
    },
  }, callback);
}


 // 4. 使用accessToken 示例。 请求修改某些和用户数据相关的api时，需要按照oauth2规范，在header里带上 accessToken， 以表示有权调用
const accessToken = localStorage.getItem("ACCESS_TOKEN");
request({
    // uri: "some api url that need auth",
    // uri: "http://localhost:7001/follow",
    uri: "http://localhost:7001/unfollow",
    rejectUnauthorized: false,
    json: true,
    headers: { Accept: '*/*', "x-access-token": accessToken },
    dataType: 'json',
    method: 'POST',
    form: {
        username:"joetothemoon",
        followed:"tengavinwood",
    },
}, function(err,resp, body){
    console.log(body);
});


```