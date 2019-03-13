const Service = require('egg').Service;

class MysqlService extends Service {
    constructor(ctx) {
        super(ctx);
    }

    async find(userId) {
        this.ctx.logger.info('debug info, find user by id');
        const user = await this.app.mysql.get('ariticle', { id: userId });
        return { user };
    }
}

module.exports = MysqlService;