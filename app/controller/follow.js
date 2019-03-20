'use strict';

const Controller = require('egg').Controller;
const moment = require('moment');
const jwt = require('jwt-simple');

class FollowController extends Controller {

  async follow() {
    const ctx = this.ctx;

    const { username = '', followed = '' } = ctx.request.body;

    try {
      this.checkAuth(username);
    } catch (err) {
      ctx.status = 401;
      ctx.body = err.message;
      return;
    }

    try {
      const now = moment().format('YYYY-MM-DD HH:mm:ss');

      const result = await this.app.mysql.query(
        'INSERT INTO follows VALUES (null, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = 1',
        [username, followed, 1, now]
      );

      const updateSuccess = result.affectedRows >= 1;

      if (updateSuccess) {
        ctx.status = 201;
      } else {
        ctx.status = 500;
      }
    } catch (err) {
      ctx.logger.error(err.sqlMessage);
      ctx.body = {
        msg: 'follow error: ' + err.sqlMessage,
      };
      ctx.status = 500;
    }
  }

  async unfollow() {
    const ctx = this.ctx;

    const { username = '', followed = '' } = ctx.request.body;

    try {
      this.checkAuth(username);
    } catch (err) {
      ctx.status = 401;
      ctx.body = err.message;
      return;
    }

    try {
      const now = moment().format('YYYY-MM-DD HH:mm:ss');

      const result = await this.app.mysql.query(
        'INSERT INTO follows VALUES (null, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = 0',
        [username, followed, 0, now]
      );

      const updateSuccess = result.affectedRows >= 1;

      if (updateSuccess) {
        ctx.status = 201;
      } else {
        ctx.status = 500;
      }
    } catch (err) {
      ctx.logger.error(err.sqlMessage);
      ctx.body = {
        msg: 'follow error: ' + err.sqlMessage,
      };
      ctx.status = 500;
    }
  }

  checkAuth(username) {

    var token = this.ctx.request.header['x-access-token'];
    if (!token) {
      throw new Error("no access_token");
    }

    // 校验 token， 解密， 验证token的可用性 ，检索里面的用户
    try {
      var decoded = jwt.decode(token, this.app.config.jwtTokenSecret);

      if (decoded.exp <= Date.now()) {
        throw new Error("access_token has expired");
      }

      if (username && username !== decoded.iss) {
         throw new Error("wrong user");
      }

      return  decoded.iss;
     
    } catch (err) {
      console.log("access token decode err", err);
      throw new Error("invaid access_token");
    }

  }

}

module.exports = FollowController;
