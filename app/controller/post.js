'use strict';

const Controller = require('egg').Controller;

const EOS = require('eosjs');
const ecc = require('eosjs-ecc');

class PostController extends Controller {

    constructor(ctx) {
        super(ctx);
        this.eosClient = EOS({
            broadcast: true,
            sign: true,
            chainId: ctx.app.config.eos.chainId,
            keyProvider: [ctx.app.config.eos.keyProvider],
            httpEndpoint: ctx.app.config.eos.httpEndpoint
        });
    }

    async publish() {
        const ctx = this.ctx;
        const { author = '', title = '', content = '', publickey, sign, hash} = ctx.request.body;

        ctx.logger.info('debug info', author, title, content, publickey, sign);

        ctx.status = 201;

        // TODO check auth 
        // accessToken = userid + username + data + salt

        // check signature
        try {
            var recover = ecc.recover(sign, `${author} ${hash}`);
            ctx.logger.info("recover", recover);
            if (recover !== publickey) {
                ctx.body = {
                    msg: "invalid signature"
                };
                ctx.status = 500;

                return;
            }
        } catch (err) {
            ctx.logger.error(err.sqlMessage);
            ctx.body = {
                msg: "invalid signature " + err
            };
            ctx.status = 500;
            return;
        }

        try {
            const result = await this.app.mysql.insert('posts', {
                author: author,
                title: title,
                public_key: publickey,
                sign: sign,
                hash: hash,
                create_time: this.app.mysql.literals.now
            });

            const updateSuccess = result.affectedRows === 1;

            if (updateSuccess) {
                // 调用 contract action
                // TODO 合约修改后，这里的data参数要改
                var actions = [];

                actions.push(
                    {
                        account: 'signature.bp',
                        name: 'publish',
                        authorization: [{
                            actor: 'signature.bp',
                            permission: 'active'
                        }],
                        data: {
                            "from": "signature.bp",
                            "fission_factor": 2000,
                        }
                    }
                );

                this.eosClient.transaction({
                    actions: actions
                }).then(data => {
                    ctx.logger.info(`publish success ..`);

                    ctx.body = {
                        msg: "success"
                    };
                    ctx.status = 201;
                }).catch(err => {
                    ctx.logger.error("publish err", err);

                    ctx.body = {
                        msg: "publish fail"
                    };
                    ctx.status = 500;
                })

            } else {
                ctx.status = 500;
            }

        } catch (err) {
            ctx.logger.error(err.sqlMessage);
            ctx.body = {
                msg: "insert error" + err.sqlMessage
            };
            ctx.status = 500;
        }
    }


    async posts() {
        const pagesize = 20;

        const { page = 1, type = 'all'} = this.ctx.query;

        const results = await this.app.mysql.select('posts', { // 搜索 post 表
            // where: { status: 0, author: ['author1', 'author2'] }, // WHERE 条件
            where: { status: 0 }, // WHERE 条件
            columns: ['author',  'title', 'short_content','hash', 'create_time'], // 要查询的表字段
            orders: [['create_time', 'desc']], // 排序方式
            limit: pagesize, // 返回数据量
            offset: (page - 1) * pagesize, // 数据偏移量
        });

        this.ctx.body = results;
    }
}

module.exports = PostController;