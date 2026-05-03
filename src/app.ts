import cors from 'cors';
import express, { Application, Request as ExRequest, Response as ExResponse, NextFunction } from 'express';
import session from 'express-session';
import 'reflect-metadata';
import { ValidateError } from 'tsoa';
import { EntityNotFoundError, ForbiddenError, JSONError, UnauthorizedError } from '@errors/custom_error';
import { RegisterRoutes } from './routes';
import cookie from "cookie-parser"
import { RES_CODE, RES_MSG } from '@constants/response_code';

export const app: Application = express();

export async function configureApp(app: Application) {
  // CORS Middleware
  app.use(
    cors({
      origin: 'http://localhost:5173', // Allow only this origin
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow only these methods
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'], // Allow only these headers
      credentials: true
    }),
  );

  // Cache-Control Middleware
  app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
    // res.setHeader('Cache-Control', 'public, max-age=3600');
    // const expires = new Date(Date.now() + 3600 * 1000).toUTCString();
    // res.setHeader('Expires', expires);
    // res.setHeader('Pragma', 'public');
    next();
  });

  // Body Parser Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Session Middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'defaultsessionsecret',
      cookie: { secure: false },
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(cookie())

  // Static Files Middleware
  app.use(express.static('public'));
  RegisterRoutes(app);


  app.use(function notFoundHandler(_req, res: ExResponse) {
    const resCode = RES_CODE.NOT_FOUND;
    res.status(resCode).send({
      message: RES_MSG[resCode],
    });
  });

  app.use(function errorHandler(err: unknown, req: ExRequest, res: ExResponse, next: NextFunction): ExResponse | void {
    if (err instanceof ValidateError) {
      console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
      return res.status(RES_CODE.VALIDATION_FAILED).json({
        message: RES_MSG[RES_CODE.VALIDATION_FAILED],
        details: err?.fields,
      });
    }
    if (err instanceof UnauthorizedError) {
      console.warn(`Caught Unauthorized Error for ${req.path}:`, err.message);
      return res.status(RES_CODE.UNAUTHORIZED).json({
        message: err.message,
      });
    }
    if (err instanceof ForbiddenError) {
      console.warn(`Caught Forbidden Error for ${req.path}:`, err.message);
      return res.status(RES_CODE.FORBIDDEN).json({
        message: err.message,
        details: err?.cause,
      });
    }
    if (err instanceof EntityNotFoundError) {
      console.warn(`Caught Entity Not Found Error for ${req.path}:`, err.message);
      return res.status(RES_CODE.NOT_FOUND).json({
        message: err.message,
      });
    }
    if (err instanceof JSONError) {
      console.warn(`Caught JSON Error for ${req.path}:`, err.message);
      return res.status(RES_CODE.JSON_ERROR).json({
        message: err.message,
      });
    }
    if (err instanceof Error) {
      console.error(err.stack);
      return res.status(RES_CODE.SERVER_ERROR).json({
        message: err.message,
      });
    }
    next();
  });
}
