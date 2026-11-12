/** Ukrainian plural form: 1 пасажир, 2–4 пасажири, 5+ пасажирів (11–14 are always the genitive plural). */
export function passengersLabel(count: number): string {
  const mod10 = count % 10, mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'пасажир' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'пасажири' : 'пасажирів';
  return `${count} ${word}`;
}

/** Ukrainian plural form for seats: 1 місце, 2–4 місця, 5+ місць (11–14 are genitive plural 'місць'). */
export function seatsWord(count: number): string {
  const mod10 = count % 10, mod100 = count % 100;
  return mod10 === 1 && mod100 !== 11 ? 'місце' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'місця' : 'місць';
}

export function seatsLabel(count: number): string {
  return `${count} ${seatsWord(count)}`;
}

