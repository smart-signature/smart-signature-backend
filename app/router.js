'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  router.get('/', controller.home.index);

  // 发布文章
  router.post('/publish', controller.post.publish);

  // 文章列表
  router.get('/posts', controller.post.posts);

  // 单篇文章
  router.get('/post/:hash', controller.post.post);

  // 获取用户信息
  router.get('/user/:id', controller.user.user);

  // 分享
  router.post('/share', controller.share.share);

  // 打赏
  router.post('/vote', controller.vote.vote);


  // ipfs service
  // router.post('/ipfs/add', controller.ipfs.add);
  // router.post('/ipfs/addJSON', controller.ipfs.addJSON);

  // router.get('/ipfs/cat/:hash', controller.ipfs.cat);
  // router.get('/ipfs/catJSON/:hash', controller.ipfs.catJSON);

};

