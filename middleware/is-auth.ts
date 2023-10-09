const isLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}

const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    else if (!(req.session.user.userAuth === 'admin')) {
        return res.redirect('/');
    }
    next();
}

const blockAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.userAuth==='admin')) {
        return res.redirect('/admin/products');
    }
    next();
}

const blockLogin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/');
    }
    next();
}

export default {isLoggedIn,isAdmin,blockLogin,blockAdmin};