type Status = 'pending' | 'success' | 'error';
type Cache<T> = {
  status: Status;
  value?: T;
  error?: Error;
};

export function createResource<T>(promise: Promise<T>) {
  const cache: Cache<T> = {
    status: 'pending',
    value: undefined,
    error: undefined,
  };

  const suspender = promise.then(
    (value) => {
      cache.status = 'success';
      cache.value = value;
    },
    (error) => {
      cache.status = 'error';
      cache.error = error;
    }
  );

  const read = () => {
    switch (cache.status) {
      case 'pending':
        throw suspender;
      case 'error':
        throw cache.error;
      case 'success':
        return cache.value;
    }
  };

  return { read };
}