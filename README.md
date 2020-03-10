# Javascript Recurring Parallel Tasks
A simple javascript manager to execute repetitive parallel tasks.

## Install
``npm i recurringtasks``

## Usage

```javascript
let RecurringTask = require('recurringtasks');

new RecurringTask(
  'banana',

  //can be any type of function; generators are cancelable
  function*() {
    this.count = this.count || 0;
    this.count++;

    if (this.count === 5) {
      this.goOn(false);
      throw new Error('Five bananas is too much!');
    }

    console.log('Peeling the banana...');
    yield new Promise(a => setTimeout(() => a('peeled'), 1000));

    console.log('Eating the banana...');
    yield new Promise(a =>
      //the 3rd banana will timeout
      setTimeout(() => a('eaten'), this.count === 3 ? 6000 : 2000)
    );

    console.log(
      'I ate ' + this.count + ' banana' + (this.count > 1 ? 's' : '')
    );

    return 'Result of task banana';
  },
  {
    //delay between repetitions, in seconds
    delay: 2,

    //maximum execution time, in seconds:
    timeout: 7,

    //execute only if no errors occurred
    success(r) {
      console.log(
        `Banana has been executed ${this.count} times, result is: ${r}`
      );
    },

    //always execute before the task
    before() {
      console.log('I will eat a banana now.');
    },

    //always execute after the task
    after(r) {
      console.log('Result is available inside after, too: ' + r + '\n');
    },

    //execute only if some error occurs
    error(e) {
      console.log(e);
    }
  }
).run();
```

If you neet to access the promises results, use an async function:

```javascript
new RecurringTask(
  'blink',

  async function() {
    this.count = this.count || 0;
    this.count++;

    if (this.count === 4) {
      this.goOn(false);
      throw new Error('Stop blinking!');
    }

    let eye = await new Promise(a => 
      setTimeout(() => a(Math.random() > 0.5 ? 'left' : 'right'), 1000)
    );
    console.log('I blinked with my ' + eye + ' eye');
  },

  {
    delay: 1
  }
).run();
```

## Danger

Promises without `await` are not intercepted with the manager `catch`:

```javascript
new RecurringTask(
  'sayHello',

  async function() {
    this.count = this.count || 0;
    this.count++;

    if (this.count === 4) {
      this.goOn(false);
      throw new Error('Goodbye');
    }

    let timeout = new Promise((a, reject) => 
      setTimeout(() => reject('Your hello is too slow.'),
      3000)
    );

    //sleep for five seconds:
    await new Promise(a => setTimeout(a, 5000));

    //this will execute, even if timeout rejects.
    console.log('Hello');
  },
  {
    delay: 1
  }
).run();
```

### The right way

```javascript
new RecurringTask(
  'sayHello',

  async function() {
    this.count = this.count || 0;
    this.count++;

    if (this.count === 4) {
      this.goOn(false);
      throw new Error('Goodbye');
    }

    let timeout = new Promise((a, reject) =>
      setTimeout(
        () => reject('Your hello is too slow.'),
        3000
      )
    );

    let sleep = new Promise(a => setTimeout(() => {
      //this will execute :(
      //is easy to solve this, but if it were a big task, without access
      //to its scope, would be complicated
      console.log('Tiny nap');
      a();
    }, 5000));

    await Promise.all([timeout, sleep]);

    //this will not execute
    console.log('Hello');
  },
  {
    delay: 1,
    error(e) {
      console.log('Error: ', e);
    }
  }
).run();
```
