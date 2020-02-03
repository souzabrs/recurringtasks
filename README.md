# recurringtasks
A simple javascript manager for recurring parallel taks.

```javascript
let RecurringTask = require('./index.js');

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
