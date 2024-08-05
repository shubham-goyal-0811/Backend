const asyncHandler = (requestHandler)=>{
    return (req, res, next) =>  {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}



export { asyncHandler };

 /*const asyncHandler = (fn) => async (req,res,next) =>{
    try{
        //next is for the middle ware
        await fn(req,res,next)
    }
    catch(error){
        res.status(error.code || 500 ).json({
            success:false,
            message:error.message
        })
    }
} //taking a function as arguement and passing it on to next function*/ 