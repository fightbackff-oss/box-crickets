import { Ball } from '../types';

export const getLegalBalls = (balls: Ball[]) => balls.filter(b => b.isLegal).length;
export const getOversText = (balls: Ball[] | number) => {
  const legal = typeof balls === 'number' ? balls : getLegalBalls(balls);
  return `${Math.floor(legal / 6)}.${legal % 6}`;
};
export const getRunRate = (runs: number, balls: Ball[] | number) => {
  const legal = typeof balls === 'number' ? balls : getLegalBalls(balls);
  if (legal === 0) return '0.0';
  return (runs / (legal / 6)).toFixed(1);
};
export const countExtras = (balls: Ball[]) => balls.filter(b => !b.isLegal).length;
