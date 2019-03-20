'use strict';

const Controller = require('egg').Controller;

const EOS = require('eosjs');
const ecc = require('eosjs-ecc');
const moment = require('moment');

class PostController extends Controller {

  constructor(ctx) {
    super(ctx);
    this.eosClient = EOS({
      broadcast: true,
      sign: true,
      chainId: ctx.app.config.eos.chainId,
      keyProvider: [ ctx.app.config.eos.keyProvider ],
      httpEndpoint: ctx.app.config.eos.httpEndpoint,
    });
  }

  async publish() {
    const ctx = this.ctx;
    const { author = '', title = '', content = '', publickey, sign, hash, username, fission_factor = 2000 } = ctx.request.body;

    ctx.logger.info('debug info', author, title, content, publickey, sign, username);

    // TODO check auth
    // accessToken = userid + username + data + salt

    // check signature
    const hash_piece1 = hash.slice(0, 12);
    const hash_piece2 = hash.slice(12, 24);
    const hash_piece3 = hash.slice(24, 36);
    const hash_piece4 = hash.slice(36, 48);

    const sign_data = `${author} ${hash_piece1} ${hash_piece2} ${hash_piece3} ${hash_piece4}`;

    try {
      const recover = ecc.recover(sign, sign_data);
      ctx.logger.info('recover', recover);
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

    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
      const result = await this.app.mysql.insert('posts', {
        author,
        username,
        title,
        public_key: publickey,
        sign,
        hash,
        fission_factor,
        create_time: now,
      });

      const updateSuccess = result.affectedRows === 1;

      if (updateSuccess) {
        ctx.logger.info('publish success ..');

        ctx.body = {
          msg: 'success',
        };
        ctx.status = 201;

      } else {
        ctx.logger.error('publish err', err);

        ctx.body = {
          msg: 'publish fail',
        };
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


  async posts() {
    const pagesize = 20;

    const { page = 1, type = 'all' } = this.ctx.query;

    const results = await this.app.mysql.select('posts', { // 搜索 post 表
      // where: { status: 0, author: ['author1', 'author2'] }, // WHERE 条件
      where: { status: 0 }, // WHERE 条件
      columns: [ 'author', 'title', 'short_content', 'hash', 'create_time' ], // 要查询的表字段
      orders: [[ 'create_time', 'desc' ]], // 排序方式
      limit: pagesize, // 返回数据量
      offset: (page - 1) * pagesize, // 数据偏移量
    });

    this.ctx.body = results;
  }

  async post() {
    const ctx = this.ctx;
    const hash = ctx.params.hash;

    const post = await this.app.mysql.get('posts', { hash });

    // TODO 阅读次数
    // const reads = await this.app.mysql.get('reads', { hash: hash });

    if (post) {
      ctx.body = post;
      ctx.status = 200;
    } else {
      ctx.body = {
        msg: 'post not found',
      };
      ctx.status = 404;
    }
  }
}

module.exports = PostController;

