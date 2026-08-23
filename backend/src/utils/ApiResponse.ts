import { Response } from 'express';

// Every successful endpoint responds with this same envelope shape, so the
// frontend can rely on `{ success, data, message }` regardless of route.
export class ApiResponse {
  static send<T>(res: Response, statusCode: number, data: T, message = 'Success'): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static ok<T>(res: Response, data: T, message = 'Success'): Response {
    return ApiResponse.send(res, 200, data, message);
  }

  static created<T>(res: Response, data: T, message = 'Created'): Response {
    return ApiResponse.send(res, 201, data, message);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
