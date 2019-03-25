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


  async shares() {
    const pagesize = 20;

    const { page = 1, signid , user  } = this.ctx.query;

    let whereOption = {
      type: "share"
    }

    if (user) {
      whereOption.author = user
    }

    if (signid) {
      whereOption.sign_id = signid
    }

    const results = await this.app.mysql.select('actions', {
      where: whereOption, // WHERE 条件
      columns: ['author', 'amount', 'sign_id', 'create_time'], // 要查询的表字段
      orders: [['create_time', 'desc']], // 排序方式
      limit: pagesize, // 返回数据量
      offset: (page - 1) * pagesize, // 数据偏移量
    });

    this.ctx.body = results;
  }

}

module.exports = ShareController;
