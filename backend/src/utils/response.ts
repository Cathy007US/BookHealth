import { Request, Response } from 'express';

export function success(res: Response, data: any = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

export function fail(res: Response, message = 'fail', code = 500, extra?: any) {
  return res.status(code >= 100 && code < 600 ? code : 500).json({
    code,
    message,
    ...extra,
  });
}

export function paginate(res: Response, list: any[], total: number, page: number, pageSize: number) {
  return res.json({
    code: 0,
    message: 'success',
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
