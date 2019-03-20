'use strict';

const Controller = require('egg').Controller;
const moment = require('moment');


class FollowController extends Controller {

    async follow() {
        const ctx = this.ctx;

        const { username = '', followed = '' } = ctx.request.body;

        if(!this.hasAuth(username)){
            ctx.status = 401;
            ctx.body = "no auth";
            return;
        }

        try {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');

            const result = await this.app.mysql.query(
                "INSERT INTO follows VALUES (null, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = 1",
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
                msg: "follow error: " + err.sqlMessage
            };
            ctx.status = 500;
        }
    }

    async unfollow() {
        const ctx = this.ctx;

        const { username = '', followed = '' } = ctx.request.body;
        
        if(!this.hasAuth(username)){
            ctx.status = 401;
            ctx.body = "no auth";
            return;
        }
        
        try {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');

            const result = await this.app.mysql.query(
                "INSERT INTO follows VALUES (null, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = 0",
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
                msg: "follow error: " + err.sqlMessage
            };
            ctx.status = 500;
        }
    }

    // TODO set JWT format accessToken into cookies when user login
    hasAuth(username) {
        return true;
    }

}

module.exports = FollowController;