/**
 *
 * @export
 * @interface IMessage
 * @template T
 */
export interface IMessage<T = unknown> {
  /**
   * Is the event issuer ID
   * @type {string}
   * @memberof IMessage
   */
  issuer: string;
  /**
   * Is the event payload
   * @type {T}
   * @memberof IMessage
   */
  payload: T;
  /**
   * Is the event type
   * @type {string}
   * @memberof IMessage
   */
  type: string;
}

/**
 * Creates a token issuer
 * @protected
 * @param {string} eventType
 * @returns {string}
 * @memberof ComBus
 */
export function createIssuer(eventType: string): string {
  return Math.floor(Math.random() * Date.now()).toString(16) + '.' + eventType;
}

/**
 * Creates a message
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
 * Dispatches an event with an optional payload
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
 * Listens for an event. When the event is handled, only the event issuer will be 
 * notified with the handler returning value
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
