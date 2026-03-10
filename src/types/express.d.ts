declare namespace Express {
  interface Request {
    user: {
      studentId?: string;
      _id?: string;
      role: string;
      wing?: string;
      email?: string;
      staffId?: string;
      id?: string;
    };
    staff?: {
      staffId: string;
      role: string;
    };
  }
}
