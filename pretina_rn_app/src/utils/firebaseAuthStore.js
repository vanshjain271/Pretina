export let currentConfirmation = null;

export const setConfirmation = (conf) => {
  currentConfirmation = conf;
};

export const getConfirmation = () => currentConfirmation;
