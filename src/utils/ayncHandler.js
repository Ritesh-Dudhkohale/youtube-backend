//using promises
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
  };
};

//This is working as wrapper function which takes another function.

export { asyncHandler };

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
