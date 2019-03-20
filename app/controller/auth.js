'use strict';

const Controller = require('egg').Controller;
const moment = require('moment');
const ecc = require('eosjs-ecc');
const base64url = require('base64url');
const jwt = require('jwt-simple');

class AuthController extends Controller {

  async auth() {
    const ctx = this.ctx;

    // 1. 取出签名
    const { username, publickey, sign } = ctx.request.body;
    console.log(username, publickey, sign);

    // 2. 验证签名
    try {
      const recover = ecc.recover(sign, username);

      if (recover !== publickey) {
        ctx.body = {
          msg: 'invalid signature',
        };
        ctx.status = 500;

        return;
      }
    } catch (err) {
      ctx.logger.error(err.sqlMessage);
      ctx.body = {
        msg: 'invalid signature ' + err,
      };
      ctx.status = 500;
      return;
    }

    // 3. 签名有效，生成accessToken . accessToken = username + date + secret (JWT format)
    var expires = moment().add(3, "days").valueOf();

    var token = jwt.encode({
      iss: username,
      exp: expires,
    }, this.app.config.jwtTokenSecret);

    ctx.body = token
  }
}

module.exports = AuthController;