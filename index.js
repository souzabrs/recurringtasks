let tasks = {};

function RecurringTask(name, functionToExecute, opt = {}) {
  let running = false,
    updated = Date.now(),
    before = opt.before ? opt.before.bind(this) : () => {},
    onError = opt.error ? opt.error.bind(this) : () => {},
    onSuccess = opt.success ? opt.success.bind(this) : () => {},
    after = opt.after ? opt.after.bind(this) : () => {},
    timeout =
      !isNaN(opt.timeout) && opt.timeout > 0 ? parseInt(opt.timeout) : 60,
    delay = !isNaN(opt.delay) && opt.delay > 0 ? parseInt(opt.delay) : 0,
    result = null,
    goOn = typeof opt.goOn !== 'undefined' ? !!opt.goOn : true,
    error = false;

  if (tasks[name]) {
    throw new Error('There is already a task called ' + name);
  }
  tasks[name] = this;

  this.name = name;

  const taskFunction = ~[
    'GeneratorFunction',
    'AsyncGeneratorFunction'
  ].indexOf(functionToExecute.constructor.name)
    ? fromGenerator(functionToExecute).bind(this)
    : functionToExecute.bind(this);

  this.isRunning = () => running;

  this.updated = () => updated;

  this.goOn = (...g) => {
    if (!g.length) {
      return goOn;
    }
    goOn = !!g[0];
  };

  this.run = async () => {
    error = false;
    result = null;
    running = true;
    await before();
    let sleep = new Promise((a, rej) =>
      setTimeout(
        () => rej(new Error('Task ' + this.name + ' timed out')),
        timeout * 1000
      )
    );
    try {
      result = await Promise.race([taskFunction(), sleep]);
      await onSuccess(result);
    } catch (e) {
      error = true;
      await onError(e);
    }
    running = false;
    updated = Date.now();
    await after(result);
    await new Promise(acc => setTimeout(() => acc(), delay * 1000));
    if (goOn) {
      this.run();
    }
  };

  this.status = () => ({
    name: this.name,
    running,
    updated,
    goOn,
    timeout,
    delay,
    error
  });
}

RecurringTask.stopAllTasks = () => {
  for (let t in tasks) {
    t = tasks[t];
    t.goOn(false);
  }
};

RecurringTask.startAllTasks = () => {
  for (let t in tasks) {
    t = tasks[t];
    t.goOn(true);
    t.run();
  }
};

RecurringTask.statusAll = () => {
  let report = [];
  for (let t in tasks) {
    t = tasks[t];
    report.push(t.status());
  }
  return report;
};

//inspiration: https://dev.to/chromiumdev/cancellable-async-functions-in-javascript-5gp7
function fromGenerator(generator) {
  let globalNonce;
  return async function(...args) {
    const localNonce = (globalNonce = Symbol());

    const iter = generator.call(this, ...args);
    let result;

    for (;;) {
      const n = await iter.next();

      result = await n.value;

      if (n.done) {
        return result;
      }

      if (localNonce !== globalNonce || this.status().error) {
        return;
      }
    }
  };
}

module.exports = RecurringTask;
