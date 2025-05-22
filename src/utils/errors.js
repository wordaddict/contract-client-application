class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
        this.status = 401;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}

module.exports = {
    UnauthorizedError,
    NotFoundError
}; 