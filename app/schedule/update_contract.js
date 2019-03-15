const Subscription = require('egg').Subscription;
const EOS = require('eosjs');

class UpdateContract extends Subscription {

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

    static get schedule() {
        return {
            interval: '10s',
            type: 'all',
        };
    }

    async subscribe() {

        this.ctx.logger.info('sync contract..');

        // this.eosClient.getAccount("joetothemoon", (error, result) => {
        //     this.ctx.logger.info('sync contract..', result);
        // })

        const results = await this.app.mysql.select('posts', {
            where: { onchain_status: 0 }, // WHERE 条件
            limit: 10, // 返回数据量
            offset: 0, // 数据偏移量
        });

        if (results.length > 0) {
            var ids = [];
            this.ctx.logger.info('new posts need to sync to contract..', results.length);

            var actions = [];

            for (var i = 0; i < results.length; i++) {

                var post = results[i];
                ids.push(post.id);
                actions.push(
                    {
                        account: 'signature.bp',
                        name: 'publish',
                        authorization: [{
                            actor: 'signature.bp',
                            permission: 'active'
                        }],
                        data: {
                            "sign": {
                                id: post.id,
                                author: post.username,
                                // author: "signature.bp",
                                fission_factor: 2000,
                                ipfs_hash: post.hash,
                                public_key: post.public_key,
                                signature: post.sign
                            }
                        }
                    }
                );
            }

            this.eosClient.transaction({
                actions: actions
            }).then(data => {
                this.ctx.logger.info('sync success..', data.transaction_id);

                const row = {
                    onchain_status: 1,
                };

                const options = {
                    where: {
                        id: ids
                    }
                };

                this.app.mysql.update('posts', row, options); 
            }).catch(err => {
                this.ctx.logger.info('sync err..', err);
            })
        } else {
            this.ctx.logger.info('new posts need to sync to contract..', results.length);
        }


    }
}

module.exports = UpdateContract;




