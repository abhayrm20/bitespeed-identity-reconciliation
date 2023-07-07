import requestId from 'express-request-id';

export const attachRequestIds = (
  options: {
    uuidVersion?: 'v1' | 'v3' | 'v4';
    setHeader?: boolean;
    headerName?: string;
    attributeName?: string;
  } = {
    uuidVersion: 'v4',
    setHeader: true,
    headerName: 'x-request-id',
    attributeName: 'xRequestId',
  }
) => {
  return requestId(options);
};
