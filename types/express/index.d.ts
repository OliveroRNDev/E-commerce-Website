import * as express from "express";
import { User } from "../../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any>
      csrfToken?: Function
      categoryList?:Record<string, any>
    }
  }
}