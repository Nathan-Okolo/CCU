const appRouter = require('./app.route');

module.exports = router => {
  router.use('/', appRouter);

  return router;
};
