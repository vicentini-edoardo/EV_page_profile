(function (global) {
  const get = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      // ignore
    }
  };

  global.StorageUtil = { get, set };
})(window);
