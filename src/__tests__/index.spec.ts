import combus from '..';

describe(`Combus is a communication bus between modules or scripts`, () => {
  it(`Can listen for an event, and handle the message`, async () => {
    const eventType = 'test';

    combus.listen(eventType, async message => {
      return message.body.payload as number + 5;
    });

    const result = await combus.dispatch(eventType, 5);

    expect(result.body.payload).toBe(10);
  });

  it(`Notifies only one dispatcher at a time`, async () => {
    const eventType = 'foo';

    combus.listen<string>(eventType, async message => {
      return `Hello ${message.body.payload}`
    });

    const result1 = await combus.dispatch(eventType, 'I am 1');
    const result2 = await combus.dispatch(eventType, 'I am 2');

    expect(result1.body.payload).toBe(`Hello I am 1`);
    expect(result2.body.payload).toBe(`Hello I am 2`);
  });

  it('Expects that only the first defined listener will respond to a dispatcher', async () => {
    const eventType = 'bar';
    const mock = jest.fn().mockReturnValue(Promise.resolve(2));

    combus.listen<number>(eventType, async () => {
      return 1;
    });

    // this will always been notified, but will never notify
    combus.listen<number>(eventType, mock);

    const result = await combus.dispatch(eventType);

    expect(result.body.payload).toBe(1);
    expect(mock).toHaveBeenCalled();
  });

  it('Could enable the creation of a state machine', async () => {
    interface ITodo {
      completed: boolean;
      id: number;
      name: string;
    }

    const createTodo = (id: number, name: string): ITodo => ({
      completed: false,
      id,
      name,
    });
    
    const state = {
      todos: [] as ITodo[],
    };

    combus.listen<ITodo[]>('get', async () => state.todos);

    combus.listen<ITodo>('add', async message => {
      state.todos.push(message.body.payload);
      return state;
    });

    combus.listen<number>('toggle', async message => {
      state.todos.forEach(todo => {
        if (todo.id !== message.body.payload) {
          return;
        }

        todo.completed = !todo.completed;
      });

      return state;
    });

    combus.listen<number>('remove', async message => {
      state.todos = state.todos.filter(i => i.id !== message.body.payload);
      return state;
    });

    await combus.dispatch('add', createTodo(0, 'foo'));
    await combus.dispatch('add', createTodo(1, 'bar'));
    await combus.dispatch('add', createTodo(2, 'baz'));

    await combus.dispatch('toggle', 2);
    await combus.dispatch('remove', 0);
    await combus.dispatch('remove', 1);

    const remainingTodos = (await combus.dispatch<ITodo[]>('get')).body.payload;

    expect(remainingTodos[0].id).toBe(2);
    expect(remainingTodos[0].name).toBe('baz');
    expect(remainingTodos[0].completed).toBeTruthy();
  });
});
