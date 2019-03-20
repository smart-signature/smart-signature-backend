'use strict';

const Controller = require('egg').Controller;


class ShareController extends Controller {

  async share() {
    const ctx = this.ctx;

    const { user = '', hash = '' } = ctx.request.body;

    try {
      const result = await this.app.mysql.insert('shares', {
        username: user,
        hash,
        create_time: this.app.mysql.literals.now,
      });

      const updateSuccess = result.affectedRows === 1;

      if (updateSuccess) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    } catch (err) {
      ctx.logger.error(err.sqlMessage);
      ctx.body = {
        msg: 'insert error' + err.sqlMessage,
      };
      ctx.status = 500;
    }
  }

}

module.exports = ShareController;
