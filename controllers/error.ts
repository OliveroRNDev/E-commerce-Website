const error404=(req,res,next) =>{
    res.status(404).render('404',{title:"Page not found",path:'error',isAuthenticated:req.session.isLoggedIn});
}

const error500=(req,res,next) =>{
    res.status(500).render('500',{title:"Error with the connection",path:'error',isAuthenticated:req.session.isLoggedIn});
}

export default {error404,error500};