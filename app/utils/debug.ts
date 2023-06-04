export const timeDiff = () => {
  let last = Date.now();
  return () => {
    const now = Date.now();
    const diff = now - last;
    last = now;
    return diff + "ms";
  };
};
