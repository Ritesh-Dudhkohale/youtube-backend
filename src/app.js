import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const corsoptions = {
    origin: process.env.CORS_ORIGIN,
    Credential: true,
};

app.use(cors(corsoptions)); //we can use cors without extra option

app.use(express.json({ limit: "16kb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

app.use(express.static("public"));
//This middleware handle all static resources and we give path where should store
//such as storing images,favicons at server

app.use(cookieParser());
//Cookie parser is used to store and access cookie on clients browser securely

//routes imports
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);

export { app };
