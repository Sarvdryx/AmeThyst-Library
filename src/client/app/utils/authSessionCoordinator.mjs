export function createAuthSessionCoordinator() {
  let tail = Promise.resolve();

  return {
    /**
     * Runs one server-session transition after every transition invoked before it.
     * Rejections are returned to the caller but do not poison the shared queue.
     *
     * @template T
     * @param {() => Promise<T> | T} operation
     * @returns {Promise<T>}
     */
    run(operation) {
      const result = tail.then(() => operation());
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}

export const authSessionCoordinator = createAuthSessionCoordinator();
