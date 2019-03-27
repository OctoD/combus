/**
 *
 * @export
 * @interface IMessage
 * @template T
 */
export interface IMessage<T = unknown> {
  payload: T;
  type: string;
  issuer: string;
}


/**
 * @protected
 * @param {string} eventType
 * @returns {string}
 * @memberof ComBus
 */
export function createIssuer(eventType: string): string {
  return Math.floor(Math.random() * Date.now()).toString(16) + '.' + eventType;
}

/**
 * @protected
 * @template T
 * @param {string} issuer
 * @param {string} type
 * @param {T} payload
 * @returns {IMessage<T>}
 * @memberof ComBus
 */
export function createMessage<T>(issuer: string, type: string, payload: T): IMessage<T> {
  return {
    issuer,
    payload,
    type,
  };
}

/**
 * @template TResponse
 * @param {string} eventType
 * @param {*} payload
 * @returns {Promise<IMessage<TResponse>>}
 * @memberof ComBus
 */
export function dispatch<TResponse>(eventType: string, payload?: any): Promise<IMessage<TResponse>> {
  const issuer = createIssuer(eventType);
  const message = createMessage(issuer, eventType, payload);

  dispatchEvent(new CustomEvent(eventType, { detail: message, }));

  return new Promise(resolve => {
    const handler = (event: Event) => {
      removeEventListener(issuer, handler);
      resolve((event as CustomEvent<IMessage<TResponse>>).detail);
    }

    addEventListener(issuer, handler);
  });
}

/**
 * @param {string} eventType
 * @param {(message: IMessage<unknown>) => Promise<unknown>} eventHandler
 * @memberof ComBus
 */
export function listen<T = unknown>(eventType: string, eventHandler: (message: IMessage<T>) => Promise<unknown>) {
  addEventListener(eventType, async event => {
    const message = (event as CustomEvent<IMessage<T>>).detail;
    const response = await eventHandler(message);
    const detail = createMessage(eventType, eventType, response);

    dispatchEvent(new CustomEvent(message.issuer, { detail }));
  });
}

export default {
  dispatch,
  listen,
};
