import combus from '..';

describe('Tests an injector', () => {
  test('injector', async () => {
    const injectables = new Map();

    combus.listen<any>('getInstance', async message => {
      const { name, args } = message.payload;

      if (!injectables.has(name)) {
        return new Error(`Injectable ${name} is not registered`);
      }

      return new (injectables.get(name))!(... args);
    });

    combus.listen<any>('inject', async message => {
      const { name, injectable } = message.payload;

      if (injectables.has(name)) {
        return new Error(`Injectable ${name} is already registered`);
      }

      injectables.set(name, injectable);
    });

    // injectables-stuff.js

    class Foo {
      constructor (public param1: number, public param2: number) {
      }

      sum() {
        return this.param1 + this.param2;
      }
    }

    class Foo2 {
      constructor (public arr: number[]) { }

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
    Promise.all([
      combus.dispatch<Foo>('getInstance', {
        name: 'Foo',
        args: [5, 10]
      }),
      combus.dispatch<Foo2>('getInstance', {
        name: 'Foo2',
        args: [1, 2, 3, 4]
      }),
    ]).then(([fooMessage, foo2Message]) => {
      expect(fooMessage.payload.sum()).toBe(15);
      expect(foo2Message.payload.sum()).toBe(10);
    }).catch(() => {});
  });
});