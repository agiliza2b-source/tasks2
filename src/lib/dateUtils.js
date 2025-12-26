export const isOverdue = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  
  // Normalize to start of day for accurate comparison
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return date < now;
};

export const format = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Adjust timezone offset to ensure correct day is shown
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });

  const formattedDate = formatter.format(date);

  if (diffDays < 0) {
    return `${formattedDate} (Atrasado)`;
  } else if (diffDays === 0) {
    return `Hoje`;
  } else if (diffDays === 1) {
    return `Amanhã`;
  }

  return formattedDate;
};