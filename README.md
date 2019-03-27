combus ☏
========

- [combus ☏](#combus-%E2%98%8F)
  - [Installation](#installation)
  - [Examples](#examples)
      - [Creating a dependency injection system](#creating-a-dependency-injection-system)
      - [Communicating between bundles](#communicating-between-bundles)
      - [Creating a state machine](#creating-a-state-machine)

A FIFO browser event based communication BUS for JavaScript and TypeScript

## Installation

```bash
# with npm
npm i --save combus

# with yarn
yarn add combus
```

## Examples

#### Creating a dependency injection system

```js
// injector.js
import combus from 'combus';

const injectables = new Map();

combus.listen('getInstance', async message => {
  const { name, args } = message.payload;

  if (!injectables.has(name)) {
    return new Error(`Injectable ${name} is not registered`);
  }

  return Reflect.construct(injectables.get(name), [].concat(args));
});

combus.listen('inject', async message => {
  const { name, injectable } = message.payload;

  if (injectables.has(name)) {
    return new Error(`Injectable ${name} is already registered`);
  }

  injectables.set(name, injectable);
});

// injectables-stuff.js
import combus from 'combus';

class Foo {
  constructor(param1, param2) {
    this.param1 = param1;
    this.param2 = param2;
  }

  sum() {
    return this.param1 + this.param2;
  }
}

class Foo2 {
  constructor(arr) {
    this.arr = arr;
  }

  sum() {
    return this.arr.reduce((s, c) => s + c, 0);
  }
}

combus.dispatch('inject', {
  name: Foo.name,
  injectable: Foo,
});

combus.dispatch('inject', {
  name: Foo2.name,
  injectable: Foo2,
});

// file-which-will-retrieve-the-injectable.js
import combus from 'combus';

Promise.all([
  combus.dispatch('getInstance', {
    name: 'Foo',
    args: [5, 10]
  }),
  combus.dispatch('getInstance', {
    name: 'Foo2',
    args: [1, 2, 3, 4]
  }),
]).then(([fooMessage, foo2Message]) => {
  const foo = fooMessage.payload;
  const foo2 = foo2Message.payload;

  console.log(foo.sum()) // 15
  console.log(foo2.sum()) // 10
});
```

#### Communicating between bundles

Combus can be used to create a dialogue between different bundles (and different frameworks or libraries).

```js
// bundle.1.js
import combus from 'combus';

const secret = 123;

combus.listen('give-me-your-secret', async message => {
  return `Hello ${message.payload}, the secret is ${secret}`;
});

// bumdle.2.js
import combus from 'combus';

combus.dispatch('give-me-your-secret', 'bundle.2').then(response => {
  console.log(response); // Hello bundle.2 , the secret is 123
});

// bumdle.3.js
import combus from 'combus';

combus.dispatch('give-me-your-secret', 'bundle.3').then(response => {
  console.log(response); // Hello bundle.3 , the secret is 123
});
```

#### Creating a state machine

Combus could be useful to create a state machine

```js
// state-machine.js
import { listen } from 'combus';

const state = {
  todos: [],
};

listen('get', async () => state);

listen('add', async message => {
  state.todos.push(message.payload);
  return state;
});

listen('toggle', async message => {
  state.todos.forEach(todo => {
    if (todo.id !== message.payload) {
      return;
    }

    todo.completed = !todo.completed;
  });

  return state;
});

listen('remove', async message => {
  state.todos = state.todos.filter(i => i.id !== message.payload);
  return state;
});

// your-logic.js
import { dispatch } from 'combus';

function create(id, name) {
  return {
    completed: false,
    id,
    name,
  }
}

(async function main() {
  const todos = (await dispatch('get')).payload;

  await dispatch('add', create(0, 'foo'));
  await dispatch('add', create(1, 'bar'));
  await dispatch('add', create(2, 'baz'));

  await dispatch('toggle', 2);
  await dispatch('remove', 0);
  await dispatch('remove', 1);

  const remainingTodos = (await dispatch('get')).payload;

  console.log(remainingTodos); // [{ id: 2, name: 'baz', completed: true }];
})();
```
