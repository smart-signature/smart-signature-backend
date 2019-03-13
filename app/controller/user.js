'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {

    async user() {
        const ctx = this.ctx;
        const userId = ctx.params.id;

        const user = await this.app.mysql.get('users', { username: userId });

        ctx.logger.info('debug info', user);

        if (user) {
            ctx.body = user;
            ctx.status = 201;
        } else {
            ctx.body = {
                msg: "user not found"
            };
            ctx.status = 404;
        }
    }
}

module.exports = UserController;