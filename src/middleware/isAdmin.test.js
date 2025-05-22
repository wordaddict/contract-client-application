const isAdmin = require('./isAdmin');

describe('isAdmin Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            profile: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should return 401 if no profile is present', () => {
        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Authentication required',
            data: null
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if profile is not an admin', () => {
        req.profile = {
            type: 'client'
        };

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Admin access required',
            data: null
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if profile is an admin', () => {
        req.profile = {
            type: 'admin'
        };

        isAdmin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
}); 