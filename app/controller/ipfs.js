'use strict';

const Controller = require('egg').Controller;

const IPFS = require('ipfs-mini');

class IPFSController extends Controller {

  constructor(ctx) {
    super(ctx);
    this.ipfs = new IPFS(); // local node
    // this.ipfs.setProvider({ host: 'ipfs', protocol: 'http' })

    this.ipfs.setProvider({ host: 'ipfs.infura.io', protocol: 'https' });
  }

  cat() {
    const ctx = this.ctx;
    const hash = ctx.params.hash;

    this.ipfs.cat(hash, (err, result) => {
      if (err) {
        ctx.status = 404;
      } else {

      }
    });
  }

  async catJSON() {
    const ctx = this.ctx;
    const hash = ctx.params.hash;

    this.ipfs.catJSON(hash).then(result => {
      ctx.body = { code: 200, data: result };
      ctx.status = 200;
    }).catch(err => {
      ctx.status = 404;
    });
  }

  async add() {
    const ctx = this.ctx;

    const { data } = ctx.request.body;

    this.ipfs.add(data).then(result => {
      ctx.body = { code: 200, hash: result };
      ctx.status = 200;
    }).catch(err => {
      ctx.status = 500;
    });
  }

  async addJSON() {
    const ctx = this.ctx;
    const { data } = ctx.request.body;

    this.ipfs.addJSON(data).then(result => {
      ctx.body = { code: 200, hash: result };
      ctx.status = 200;
    }).catch(err => {
      ctx.status = 500;
    });
  }


}

module.exports = IPFSController;
