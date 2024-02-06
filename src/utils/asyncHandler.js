//using promises
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err)
        );
    };
};

//This is working as wrapper function which takes another function and returns function.

export default asyncHandler;

//using try-catch
// const asyncHandler = (fn) => {
//   async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       res.staus(error.code || 500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };
// };
