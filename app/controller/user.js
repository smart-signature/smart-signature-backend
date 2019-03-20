'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {

    async user() {
        const ctx = this.ctx;

        const username = ctx.params.username;

        // 2.获取某账号关注数 
        const follows = await this.app.mysql.query(
            "select count(*) as follows from follows where username = ? and status=1",
            [username]
        );

        // 3.获取某账号粉丝数 
        const fans = await this.app.mysql.query(
            "select count(*) as fans from follows where followed = ? and status=1",
            [username]
        );

        const result = {
            username: username,
            follows: follows[0].follows,
            fans: fans[0].fans,
        }

        ctx.logger.info('debug info', result);

        ctx.body = result;
        ctx.status = 200;
    }
}

module.exports = UserController;