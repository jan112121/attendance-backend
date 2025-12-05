import jwt from 'jsonwebtoken';

export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });

      if (roles.length && !roles.includes(decoded.role_id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.user = decoded;
      next();
    });
  };
};
