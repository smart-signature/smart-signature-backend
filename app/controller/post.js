'use strict';

const Controller = require('../core/base_controller');

const EOS = require('eosjs');
const ecc = require('eosjs-ecc');
const moment = require('moment');
var _ = require('lodash');

class PostController extends Controller {

  constructor(ctx) {
    super(ctx);
    this.eosClient = EOS({
      broadcast: true,
      sign: true,
      chainId: ctx.app.config.eos.chainId,
      keyProvider: [ctx.app.config.eos.keyProvider],
      httpEndpoint: ctx.app.config.eos.httpEndpoint,
    });
  }

  async publish() {
    const ctx = this.ctx;
    const { author = '', title = '', content = '', publickey, sign, hash, username, fissionFactor = 2000 } = ctx.request.body;

    ctx.logger.info('debug info', author, title, content, publickey, sign, username);

    if (fissionFactor > 2000) {
      // fissionFactor = 2000; // 最大2000
      ctx.body = {
        msg: 'fissionFactor should >= 2000',
      };
      ctx.status = 500;

      return;
    }

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
        fission_factor: fissionFactor,
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

    const { page = 1, type = 'all', author } = this.ctx.query;

    let whereOption = {
      status: 0
    }

    if (author) {
      whereOption.author = [author]
    }

    const results = await this.app.mysql.select('posts', { // 搜索 post 表
      // where: { status: 0, author: ['author1', 'author2'] }, // WHERE 条件
      where: whereOption, // WHERE 条件
      columns: ['id', 'author', 'title', 'short_content', 'hash', 'create_time'], // 要查询的表字段
      orders: [['create_time', 'desc']], // 排序方式
      limit: pagesize, // 返回数据量
      offset: (page - 1) * pagesize, // 数据偏移量
    });

    if (results.length > 0) {

      // 阅读次数
      for (let i = 0; i < results.length; i++) {
        if (this.app.read_cache[results[i].id] !== undefined) {
          results[i].read = this.app.read_cache[results[i].id];
        } else {
          const read = await this.app.mysql.query(
            'select count(*) as num from readers where hash = ? ',
            [results[i].hash]
          );
          results[i].read = read[0].num;
          this.app.read_cache[results[i].id] = read[0].num;
        }
      }

      // 被赞总金额
      for (let i = 0; i < results.length; i++) {
        if (this.app.value_cache[results[i].id] !== undefined) {
          results[i].value = this.app.value_cache[results[i].id];
        } else {
          const value = await this.app.mysql.query(
            'select sum(amount) as value from actions where sign_id = ? and type = ? ',
            [results[i].id, "share"]
          );

          let num = value[0].value || 0;

          results[i].value = num;
          this.app.value_cache[results[i].id] = num;
        }
      }

      // 赞赏次数
      for (let i = 0; i < results.length; i++) {
        if (this.app.ups_cache[results[i].id] !== undefined) {
          results[i].ups = this.app.ups_cache[results[i].id];
        } else {
          const ups = await this.app.mysql.query(
            'select count(*) as ups from actions where sign_id = ? and type = ? ',
            [results[i].id, "share"]
          );

          results[i].ups = ups[0].ups;
          this.app.ups_cache[results[i].id] = ups[0].ups;
        }
        this.app.post_cache[results[i].id] = results[i];
      }
      
    }

    this.ctx.body = results;
  }

  async getSupportTimesRanking() {
    const pagesize = 20;

    const { page = 1 } = this.ctx.query;

    const results = await this.app.mysql.query(
      'select sign_id, count(*) as total from actions where type = ? group by sign_id order by total desc limit ?,?',
      ["share", (page - 1) * pagesize, pagesize]
    );

    let signids = [];
    _.each(results, (row) => {
      signids.push(row.sign_id);
    })

    let results2 = [];

    if (signids.length > 0) {

      let whereOption2 = {
        id: signids
      }

      results2 = await this.app.mysql.select('posts', { // 搜索 post 表
        where: whereOption2, // WHERE 条件
        columns: ['id', 'author', 'title', 'short_content', 'hash', 'create_time'], // 要查询的表字段
        orders: [['create_time', 'desc']], // 排序方式
        limit: pagesize, // 返回数据量
        offset: (page - 1) * pagesize, // 数据偏移量
      });

      _.each(results2, (row2) => {
        _.each(results, (row) => {
          if (row2.id === row.sign_id) {
            row2.times = row.total;
          }
        })
      })

      results2 = results2.sort((a, b) => {
        return b.times - a.times;
      })

      // 阅读次数
      for (let i = 0; i < results2.length; i++) {
        if (this.app.read_cache[results2[i].id] !== undefined) {
          results2[i].read = this.app.read_cache[results2[i].id];
        } else {
          const read = await this.app.mysql.query(
            'select count(*) as num from readers where hash = ? ',
            [results2[i].hash]
          );
          results2[i].read = read[0].num;
          this.app.read_cache[results2[i].id] = read[0].num;
        }
      }

      // 被赞总金额
      for (let i = 0; i < results2.length; i++) {
        if (this.app.value_cache[results2[i].id] !== undefined) {
          results2[i].value = this.app.value_cache[results2[i].id];
        } else {
          const value = await this.app.mysql.query(
            'select sum(amount) as value from actions where sign_id = ? and type = ? ',
            [results2[i].id, "share"]
          );

          let num = value[0].value || 0;

          results2[i].value = num;
          this.app.value_cache[results2[i].id] = num;

          this.app.post_cache[results2[i].id] = results2[i];
        }
      }
    }

    this.ctx.body = results2;
  }

  async getSupportAmountRanking() {
    const pagesize = 20;

    const { page = 1 } = this.ctx.query;

    const results = await this.app.mysql.query(
      'select sign_id, sum(amount) as total from actions where type = ? group by sign_id order by total desc limit ?,?',
      ["share", (page - 1) * pagesize, pagesize]
    );

    let signids = [];
    _.each(results, (row) => {
      signids.push(row.sign_id);
    })

    let results2 = [];

    if (signids.length > 0) {

      let whereOption2 = {
        id: signids
      }

      results2 = await this.app.mysql.select('posts', { // 搜索 post 表
        where: whereOption2, // WHERE 条件
        columns: ['id', 'author', 'title', 'short_content', 'hash', 'create_time'], // 要查询的表字段
        orders: [['create_time', 'desc']], // 排序方式
        limit: pagesize, // 返回数据量
        offset: (page - 1) * pagesize, // 数据偏移量
      });

      _.each(results2, (row2) => {
        _.each(results, (row) => {
          if (row2.id === row.sign_id) {
            row2.value = row.total;
          }
        })
      })

      results2 = results2.sort((a, b) => {
        return b.value - a.value;
      })

      // 阅读次数
      for (let i = 0; i < results2.length; i++) {
        if (this.app.read_cache[results2[i].id] !== undefined) {
          results2[i].read = this.app.read_cache[results2[i].id];
        } else {
          const read = await this.app.mysql.query(
            'select count(*) as num from readers where hash = ? ',
            [results2[i].hash]
          );
          results2[i].read = read[0].num;
          this.app.read_cache[results2[i].id] = read[0].num;
        }
      }

      // 赞赏次数
      for (let i = 0; i < results2.length; i++) {
        if (this.app.ups_cache[results2[i].id] !== undefined) {
          results2[i].ups = this.app.ups_cache[results2[i].id];
        } else {
          const ups = await this.app.mysql.query(
            'select count(*) as ups from actions where sign_id = ? and type = ? ',
            [results2[i].id, "share"]
          );

          results2[i].ups = ups[0].ups;
          this.app.ups_cache[results2[i].id] = ups[0].ups;

          this.app.post_cache[results2[i].id] = results2[i];
        }
      }

    }

    this.ctx.body = results2;
  }

  async supports() {
    const pagesize = 20;

    const { page = 1, user } = this.ctx.query;

    let whereOption = {
      type: "share"
    }

    if (user) {
      whereOption.author = user
    }

    const results = await this.app.mysql.select('actions', {
      where: whereOption, // WHERE 条件
      columns: ['author', 'amount', 'sign_id', 'create_time'], // 要查询的表字段
      orders: [['create_time', 'desc']], // 排序方式
      limit: pagesize, // 返回数据量
      offset: (page - 1) * pagesize, // 数据偏移量
    });

    let signids = [];
    _.each(results, (row) => {
      signids.push(row.sign_id);
    })

    let results2 = [];

    if (signids.length > 0) {

      let whereOption2 = {
        id: signids
      }

      results2 = await this.app.mysql.select('posts', { // 搜索 post 表
        where: whereOption2, // WHERE 条件
        columns: ['id', 'author', 'title', 'short_content', 'hash', 'create_time'], // 要查询的表字段
        orders: [['create_time', 'desc']], // 排序方式
        limit: pagesize, // 返回数据量
        offset: (page - 1) * pagesize, // 数据偏移量
      });
    }

    this.ctx.body = results2;
  }

  async post() {
    const ctx = this.ctx;
    const hash = ctx.params.hash;

    const post = await this.app.mysql.get('posts', { hash });

    if (post) {
      // 阅读次数
      const read = await this.app.mysql.query(
        'select count(*) as num from readers where hash = ? ',
        [hash]
      );

      post.read = read[0].num;

      // 被赞次数
      const ups = await this.app.mysql.query(
        'select count(*) as ups from actions where sign_id = ? and type = ? ',
        [post.id, "share"]
      );

      post.ups = ups[0].ups;


      // 被赞总金额
      const value = await this.app.mysql.query(
        'select sum(amount) as value from actions where sign_id = ? and type = ? ',
        [post.id, "share"]
      );

      post.value = value[0].value || 0;

      // update cahce
      this.app.read_cache[post.id] = post.read;
      this.app.value_cache[post.id] = post.value;
      this.app.ups_cache[post.id] = post.ups;

      this.app.post_cache[post.id] = post;

      ctx.body = post;
      ctx.status = 200;
    } else {
      ctx.body = {
        msg: 'post not found',
      };
      ctx.status = 404;
    }
  }

  async p() {
    const ctx = this.ctx;
    const id = ctx.params.id;

    const post = await this.app.mysql.get('posts', { id });

    if (post) {
      // 阅读次数
      const read = await this.app.mysql.query(
        'select count(*) as num from readers where hash = ? ',
        [id]
      );

      post.read = read[0].num;

      // 被赞次数
      const ups = await this.app.mysql.query(
        'select count(*) as ups from actions where sign_id = ? and type = ? ',
        [post.id, "share"]
      );

      post.ups = ups[0].ups;

      // 被赞总金额
      const value = await this.app.mysql.query(
        'select sum(amount) as value from actions where sign_id = ? and type = ? ',
        [post.id, "share"]
      );

      post.value = value[0].value || 0;

      // update cahce
      this.app.read_cache[post.id] = post.read;
      this.app.value_cache[post.id] = post.value;
      this.app.ups_cache[post.id] = post.ups;

      this.app.post_cache[post.id] = post;

      ctx.body = post;
      ctx.status = 200;
    } else {
      ctx.body = {
        msg: 'post not found',
      };
      ctx.status = 404;
    }
  }

  async show() {
    const ctx = this.ctx;
    const hash = ctx.params.hash;

    const current_user = this.get_current_user() || "anonymous";
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
      const result = await this.app.mysql.insert('readers', {
        reader: current_user,
        hash,
        create_time: now
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

  async delete() {
    const ctx = this.ctx;
    const id = ctx.params.id;

    if (!id) {
      ctx.status = 500;
      ctx.body = "sign_id required";
      return;
    }

    const username = this.get_current_user();

    try {
      this.checkAuth(username);
    } catch (err) {
      ctx.status = 401;
      ctx.body = err.message;
      return;
    }

    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

      // 检查是否是自己的文章
      const post = await this.app.mysql.get('posts', { id });

      if (!post) {
        ctx.status = 500;
        ctx.body = "post not found";
        return;
      } else {
        if (post.author !== username) {
          ctx.status = 500;
          ctx.body = "only post owner can delete";
          return;
        }
      }

      const row = {
        status: 1,
      };

      const options = {
        where: {
          id: id,
        },
      };

      let result = await this.app.mysql.update('posts', row, options);

      const updateSuccess = result.affectedRows === 1;

      if (updateSuccess) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = {
        msg: 'delete error' + err.sqlMessage,
      };
      ctx.status = 500;
    }
  }

  async comment() {
    const ctx = this.ctx;
    const { comment = '', sign_id  } = ctx.request.body;

    if (!sign_id) {
      ctx.status = 500;
      ctx.body = "sign_id required";
      return;
    }

    const username = this.get_current_user();

    try {
      this.checkAuth(username);
    } catch (err) {
      ctx.status = 401;
      ctx.body = err.message;
      return;
    }

    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
      const result = await this.app.mysql.insert('comments', {
        username,
        sign_id,
        comment,
        create_time: now
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

module.exports = PostController;

