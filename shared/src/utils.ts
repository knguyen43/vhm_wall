export const formatPersonName = (person: { firstName: string; lastName: string }): string => {
  return `${person.firstName} ${person.lastName}`;
};
