import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "50mb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes

import router from "./routes/mainRouter.js"
import PaymentRouter from "./routes/payment.routes.js"
import TDRouter from "./routes/TruthOrDare/TD.route.js";


//routes decleartaion

app.use("/api/v1/users", router)
app.use("/api/v1/payment", PaymentRouter)
app.use("/api/truth-or-dare", TDRouter);



export { app }