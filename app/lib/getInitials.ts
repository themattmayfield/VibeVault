const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
  return initials;
};

export default getInitials;
