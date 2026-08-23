import { Response } from 'express';

/** Minimal chainable Express Response mock shared across controller tests. */
export function mockRes(): Response & {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
} {
  const res = {} as Response & {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}
